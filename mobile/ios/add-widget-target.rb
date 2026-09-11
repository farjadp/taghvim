# ============================================================================
# Source: mobile/ios/add-widget-target.rb
# Version: 0.1.0 — 2026-09-11
# Why: Adds the WidgetKit extension to the Xcode project Capacitor generated,
#      with the xcodeproj gem rather than by hand-editing project.pbxproj:
#      the TaghvimWidgets target (iOS 16, for the lock-screen families), its
#      sources, widget-data.json from mobile/shared as a resource, the local
#      TaghvimCore package, the App Group entitlements on both targets, the
#      extension embedded in the app, and the app's two new Swift files.
#      Idempotent: it refuses to run twice.
# Env / Deps: Ruby, xcodeproj gem. ruby mobile/ios/add-widget-target.rb
# ============================================================================

require 'xcodeproj'

root = File.expand_path('app/App', __dir__)
project = Xcodeproj::Project.open(File.join(root, 'App.xcodeproj'))
abort 'TaghvimWidgets already exists' if project.targets.any? { |t| t.name == 'TaghvimWidgets' }

app = project.targets.find { |t| t.name == 'App' } or abort 'no App target'
widget = project.new_target(:app_extension, 'TaghvimWidgets', :ios, '16.0')

# Sources and the extension's own files.
group = project.main_group.new_group('TaghvimWidgets', 'TaghvimWidgets')
%w[TaghvimWidgets.swift WidgetViews.swift].each do |name|
  widget.source_build_phase.add_file_reference(group.new_file(name))
end
group.new_file('Info.plist')
group.new_file('TaghvimWidgets.entitlements')

# The same data file the site's tests hold equal to eventsForDate.
shared = project.main_group.new_group('Shared', '../../../shared')
widget.resources_build_phase.add_file_reference(shared.new_file('widget-data.json'))

# The local Swift package the Android twin is tested against.
package = project.new(Xcodeproj::Project::Object::XCLocalSwiftPackageReference)
package.relative_path = '../../TaghvimCore'
project.root_object.package_references << package
product = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
product.product_name = 'TaghvimCore'
product.package = package
widget.package_product_dependencies << product
link = project.new(Xcodeproj::Project::Object::PBXBuildFile)
link.product_ref = product
widget.frameworks_build_phase.files << link

# The gem's app-extension template leaves PRODUCT_NAME unset, so the product
# was a nameless «.appex» and the build failed with «Multiple commands produce
# …/.appex» (found on the first run, 11 Sep). Name it after the target.
widget.product_reference.path = 'TaghvimWidgets.appex'
widget.build_configurations.each do |config|
  s = config.build_settings
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['PRODUCT_BUNDLE_IDENTIFIER'] = 'im.taghv.app.widgets'
  s['INFOPLIST_FILE'] = 'TaghvimWidgets/Info.plist'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['CODE_SIGN_ENTITLEMENTS'] = 'TaghvimWidgets/TaghvimWidgets.entitlements'
  s['SWIFT_VERSION'] = '5.0'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
  s['TARGETED_DEVICE_FAMILY'] = '1,2'
  s['SKIP_INSTALL'] = 'YES'
  s['MARKETING_VERSION'] = '1.0'
  s['CURRENT_PROJECT_VERSION'] = '1'
  s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
end

# The app: its entitlements, its two new files, and the extension embedded.
app.build_configurations.each { |config| config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements' }
app_group = project.main_group['App'] or abort 'no App group'
%w[WidgetSyncPlugin.swift MainViewController.swift].each do |name|
  app.source_build_phase.add_file_reference(app_group.new_file(name))
end
app_group.new_file('App.entitlements')
app.add_dependency(widget)
embed = app.new_copy_files_build_phase('Embed Foundation Extensions')
embed.dst_subfolder_spec = '13' # PlugIns
embed.add_file_reference(widget.product_reference).settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

project.save
puts "added TaghvimWidgets (#{widget.uuid}) and wired it into App"
