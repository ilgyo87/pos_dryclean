#import "BrotherPrinterModule.h"
#import <BRLMPrinterKit/BRLMPrinterKit.h>
#import <UIKit/UIKit.h>

@implementation BrotherPrinterModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(printLabel:(NSString *)ipAddress
                  labelImagePath:(NSString *)labelImagePath
                  paperType:(NSString *)paperType
                  labelType:(NSString *)labelType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    BRLMChannel *channel = [[BRLMChannel alloc] initWithWifiIPAddress:ipAddress];
    BRLMPrinterDriverGenerateResult *generateResult = [BRLMPrinterDriverGenerator openChannel:channel];
    if (generateResult.error.code != BRLMOpenChannelErrorCodeNoError || generateResult.driver == nil) {
      reject(@"open_channel_error", @"Failed to open channel", nil);
      return;
    }
    BRLMPrinterDriver *printerDriver = generateResult.driver;

    // Prepare print settings for selected label type
    BRLMQLPrintSettings *settings = [[BRLMQLPrintSettings alloc] init];
    settings.labelSize = [BrotherPrinterModule labelSizeFromString:paperType];
    NSLog(@"[BrotherPrinterModule] Using label size: %@ (enum value: %ld)", paperType, (long)settings.labelSize);
    settings.printQuality = BRLMPrintSettingsPrintQualityStandard;

    // Set autoCut/cutAtEnd for continuous labels
    BOOL isContinuous = [BrotherPrinterModule isContinuousLabel:labelType];
    settings.autoCut = isContinuous ? YES : NO;
    settings.cutAtEnd = isContinuous ? YES : NO;
    NSLog(@"[BrotherPrinterModule] Label type: %@ (continuous: %@)", labelType, isContinuous ? @"YES" : @"NO");

    // Load the image
    UIImage *labelImage = [UIImage imageWithContentsOfFile:labelImagePath];
    if (!labelImage) {
      NSLog(@"[BrotherPrinterModule] Failed to load image at path: %@", labelImagePath);
      [printerDriver closeChannel];
      reject(@"image_load_error", @"Could not load image", nil);
      return;
    }
    NSLog(@"[BrotherPrinterModule] Loaded image, printing...");

    BRLMPrintError *printError = nil;
    [printerDriver printImage:labelImage settings:settings error:&printError];
    NSLog(@"[BrotherPrinterModule] Print error code: %ld (%@)", (long)printError.code, printError.localizedDescription);

    [printerDriver closeChannel];

    if (printError.code != BRLMPrintErrorCodeNoError) {
      reject(@"print_error", [NSString stringWithFormat:@"Failed to print label, error code: %ld (%@)", (long)printError.code, printError.localizedDescription], nil);
    } else {
      resolve(@(YES));
    }
  });
}

+ (BRLMQLPrintSettingsLabelSize)labelSizeFromString:(NSString *)paperType {
  if (!paperType) return BRLMQLPrintSettingsLabelSize29x90mm;
  NSString *type = [paperType lowercaseString];
  // Continuous (roll) tape
  if ([type isEqualToString:@"12mm"]) return BRLMQLPrintSettingsLabelSize12mm;
  if ([type isEqualToString:@"29mm"]) return BRLMQLPrintSettingsLabelSize29mm;
  if ([type isEqualToString:@"38mm"]) return BRLMQLPrintSettingsLabelSize38mm;
  if ([type isEqualToString:@"50mm"]) return BRLMQLPrintSettingsLabelSize50mm;
  if ([type isEqualToString:@"54mm"]) return BRLMQLPrintSettingsLabelSize54mm;
  if ([type isEqualToString:@"62mm"]) return BRLMQLPrintSettingsLabelSize62mm;
  if ([type isEqualToString:@"29x90mm"]) return BRLMQLPrintSettingsLabelSize29x90mm;
  if ([type isEqualToString:@"38x90mm"]) return BRLMQLPrintSettingsLabelSize38x90mm;
  if ([type isEqualToString:@"50x90mm"]) return BRLMQLPrintSettingsLabelSize50x90mm;
  if ([type isEqualToString:@"62x100mm"]) return BRLMQLPrintSettingsLabelSize62x100mm;
  // Die-cut (pre-cut) labels
  if ([type isEqualToString:@"diecut17x54mm"]) return BRLMQLPrintSettingsLabelSizeDieCutW17H54mm;
  if ([type isEqualToString:@"diecut17x87mm"]) return BRLMQLPrintSettingsLabelSizeDieCutW17H87mm;
  if ([type isEqualToString:@"diecut23x23mm"]) return BRLMQLPrintSettingsLabelSizeDieCutW23H23mm;
  if ([type isEqualToString:@"diecut29x42mm"]) return BRLMQLPrintSettingsLabelSizeDieCutW29H42mm;
  if ([type isEqualToString:@"diecut29x90mm"]) return BRLMQLPrintSettingsLabelSizeDieCutW29H90mm;
  if ([type isEqualToString:@"diecut38x90mm"]) return BRLMQLPrintSettingsLabelSizeDieCutW38H90mm;
  if ([type isEqualToString:@"diecut39x48mm"]) return BRLMQLPrintSettingsLabelSizeDieCutW39H48mm;
  if ([type isEqualToString:@"diecut52x29mm"]) return BRLMQLPrintSettingsLabelSizeDieCutW52H29mm;
  if ([type isEqualToString:@"diecut62x29mm"]) return BRLMQLPrintSettingsLabelSizeDieCutW62H29mm;
  if ([type isEqualToString:@"diecut62x100mm"]) return BRLMQLPrintSettingsLabelSizeDieCutW62H100mm;
  if ([type isEqualToString:@"diecut60x86mm"]) return BRLMQLPrintSettingsLabelSizeDieCutW60H86mm;
  // Add more mappings as needed for your media
  return BRLMQLPrintSettingsLabelSize29x90mm; // default to 29x90mm continuous
}

+ (BOOL)isContinuousLabel:(NSString *)labelType {
  if (!labelType) return YES;
  NSString *type = [labelType lowercaseString];
  if ([type containsString:@"continuous"]) return YES;
  if ([type containsString:@"roll"]) return YES;
  if ([type containsString:@"die-cut"]) return NO;
  if ([type containsString:@"diecut"]) return NO;
  // Default to continuous
  return YES;
}

RCT_EXPORT_METHOD(disconnectPrinter:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  // If you maintain a persistent printerDriver/channel, close it here. If not, just log.
  NSLog(@"[BrotherPrinterModule] disconnectPrinter called. (No persistent channel to close in current implementation)");
  // Optionally clear any cached config here if you cache it natively.
  resolve(@(YES));
}

@end
