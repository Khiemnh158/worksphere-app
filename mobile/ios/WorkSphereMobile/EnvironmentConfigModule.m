#import "EnvironmentConfigModule.h"

@implementation EnvironmentConfigModule

RCT_EXPORT_MODULE(EnvironmentConfig);

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSDictionary *)constantsToExport
{
  NSString *baseUrl = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"WORKSPHERE_API_BASE_URL"];
  return @{
    @"API_BASE_URL": baseUrl ?: @""
  };
}

@end
