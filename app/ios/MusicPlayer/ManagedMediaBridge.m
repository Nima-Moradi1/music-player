#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ManagedMedia, NSObject)
RCT_EXTERN_METHOD(createId:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(cancel:(NSString *)jobId)
RCT_EXTERN_METHOD(freeBytes:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(reconcile:(NSString *)ownedPathsJson resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(stage:(NSString *)jobId uri:(NSString *)uri maxBytes:(double)maxBytes resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(download:(NSString *)jobId url:(NSString *)url maxBytes:(double)maxBytes resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(inspect:(NSString *)jobId path:(NSString *)path resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(promote:(NSString *)path hash:(NSString *)hash ext:(NSString *)ext resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(remove:(NSString *)path resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end


@interface RCT_EXTERN_MODULE(Haptics, NSObject)
RCT_EXTERN_METHOD(feedback:(NSString *)kind)
@end
