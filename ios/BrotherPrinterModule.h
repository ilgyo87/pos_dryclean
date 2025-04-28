#import <React/RCTBridgeModule.h>

@interface BrotherPrinterModule : NSObject <RCTBridgeModule>
@end

// Expose printLabel with paperType and labelType
// - (void)printLabel:(NSString *)ipAddress labelImagePath:(NSString *)labelImagePath paperType:(NSString *)paperType labelType:(NSString *)labelType resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;
// Expose disconnectPrinter for manual disconnect
// - (void)disconnectPrinter:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;

