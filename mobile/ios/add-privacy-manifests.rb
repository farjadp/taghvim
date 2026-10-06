# ============================================================================
# Source: mobile/ios/add-privacy-manifests.rb
# Version: 0.1.0 — 2026-10-06
# Why: Adds PrivacyInfo.xcprivacy to the App and TaghvimWidgets targets as a
#      bundle resource. App Store Connect rejects an upload whose code reads
#      UserDefaults without a declared reason; both targets do, through the
#      App Group. Uses the xcodeproj gem, like add-widget-target.rb, rather
#      than hand-editing project.pbxproj. Idempotent: skips a target that
#      already carries the file.
# Env / Deps: Ruby, xcodeproj gem. ruby mobile/ios/add-privacy-manifests.rb
# ============================================================================

require 'xcodeproj'

root = File.expand_path('app/App', __dir__)
project = Xcodeproj::Project.open(File.join(root, 'App.xcodeproj'))

# Target name → the group its own files live in (same folder name on disk).
{ 'App' => 'App', 'TaghvimWidgets' => 'TaghvimWidgets' }.each do |target_name, group_name|
  target = project.targets.find { |t| t.name == target_name } or abort "no #{target_name} target"
  if target.resources_build_phase.files_references.any? { |f| f.path&.end_with?('PrivacyInfo.xcprivacy') }
    puts "#{target_name}: already has PrivacyInfo.xcprivacy"
    next
  end
  group = project.main_group.children.find { |g| g.display_name == group_name } or abort "no #{group_name} group"
  ref = group.files.find { |f| f.path == 'PrivacyInfo.xcprivacy' } || group.new_file('PrivacyInfo.xcprivacy')
  target.resources_build_phase.add_file_reference(ref)
  puts "#{target_name}: added"
end

project.save
