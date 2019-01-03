/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "ABI32_0_0ARTContainer.h"
#import "ABI32_0_0ARTNode.h"

@interface ABI32_0_0ARTGroup : ABI32_0_0ARTNode <ABI32_0_0ARTContainer>

@property (nonatomic, assign) CGRect clipping;

@end
