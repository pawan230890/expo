/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI32_0_0fabric/ABI32_0_0components/activityindicator/ActivityIndicatorViewProps.h>
#include <ABI32_0_0fabric/ABI32_0_0components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace ReactABI32_0_0 {

extern const char ActivityIndicatorViewComponentName[];

/*
 * `ShadowNode` for <ActivityIndicatorView> component.
 */
using ActivityIndicatorViewShadowNode =
  ConcreteViewShadowNode<
    ActivityIndicatorViewComponentName,
    ActivityIndicatorViewProps
  >;

} // namespace ReactABI32_0_0
} // namespace facebook
