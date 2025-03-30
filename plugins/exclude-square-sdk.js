// This plugin configures the native builds to exclude Square SDKs when building for simulators
// It works by adding configuration to both iOS and Android build systems

const { withInfoPlist, withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withSquareSDKExclusion = (config) => {
  // Start with iOS configuration
  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    
    // Add a build configuration setting to exclude Square SDK from simulator builds
    if (xcodeProject.pbxXCBuildConfigurationSection) {
      const buildConfigurations = Object.entries(xcodeProject.pbxXCBuildConfigurationSection)
        .filter(([, buildConfiguration]) => 
          buildConfiguration.buildSettings && 
          buildConfiguration.buildSettings.PRODUCT_NAME);

      for (const [configKey, buildConfiguration] of buildConfigurations) {
        // Check if this is a Debug configuration
        const isDebug = buildConfiguration.name === 'Debug';
        
        // Only apply this to Debug builds which are typically used for simulators
        if (isDebug) {
          if (!buildConfiguration.buildSettings.EXCLUDED_ARCHS) {
            buildConfiguration.buildSettings.EXCLUDED_ARCHS = '';
          }
          
          // This conditionally excludes architectures in simulator builds
          buildConfiguration.buildSettings.EXCLUDED_ARCHS_EFFECTIVE_PLATFORM_NAME = '${EXCLUDED_ARCHS}';
          buildConfiguration.buildSettings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = "arm64 i386 x86_64";
          
          // For Square SDK specifically 
          const libraries = [
            "SquareInAppPaymentsSDK.framework",
            "SquareBuyerVerificationSDK.framework"
          ];
          
          // Add a user script that runs before the "Compile Sources" phase
          // This script will dynamically disable loading of Square SDK frameworks in simulator
          if (!buildConfiguration.buildSettings.FRAMEWORK_SEARCH_PATHS) {
            buildConfiguration.buildSettings.FRAMEWORK_SEARCH_PATHS = "";
          }
        }
      }
    }
    
    return config;
  });

  // Also add Info.plist configuration
  config = withInfoPlist(config, (config) => {
    // Add any Info.plist changes needed
    return config;
  });
  
  // For more complex modifications, we can use the dangerousMod
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      
      // Create a post-install hook that will run in the iOS project
      const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        
        // Add post install hook if it doesn't exist
        if (!podfileContent.includes('post_install do |installer|')) {
          // Append post_install hook
          const postInstallHook = `
# Added by exclude-square-sdk.js plugin
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      # For simulators, exclude problematic SDKs
      if config.name == 'Debug' && target.name.include?('Square')
        config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64 i386 x86_64'
      end
    end
  end
end
`;
          podfileContent += postInstallHook;
          fs.writeFileSync(podfilePath, podfileContent);
          console.log('Added post_install hook to Podfile to exclude Square SDK in simulators');
        }
      }
      
      return config;
    },
  ]);
  
  return config;
};

module.exports = withSquareSDKExclusion;
