// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef WebDeviceProximetryListener_h
#define WebDeviceProximetryListener_h

#include "WebPlatformEventListener.h"

namespace blink {

class WebDeviceProximityData;

class WebDeviceProximityListener : public WebPlatformEventListener {
public:
    // This method is called every time new device proximity data is available.
    virtual void didChangeDeviceProximity(const WebDeviceProximityData&) = 0;

    virtual ~WebDeviceProximityListener() { }
};

} // namespace blink

#endif // WebDeviceProximetryListener_h
