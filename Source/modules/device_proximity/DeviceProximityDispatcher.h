// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef DeviceProximityDispatcher_h
#define DeviceProximityDispatcher_h

#include "core/frame/PlatformEventDispatcher.h"
#include "platform/heap/Handle.h"
#include "public/platform/WebDeviceProximityListener.h"

namespace blink {

class DeviceProximityData;
class WebDeviceProximityData;

// This class listens to device proximity data and notifies all registered controllers.
class DeviceProximityDispatcher final : public GarbageCollectedFinalized<DeviceProximityDispatcher>, public PlatformEventDispatcher, public WebDeviceProximityListener {
    USING_GARBAGE_COLLECTED_MIXIN(DeviceProximityDispatcher);
public:
    static DeviceProximityDispatcher& instance();
    virtual ~DeviceProximityDispatcher();

    DeviceProximityData* latestDeviceProximityData();

    // Inherited from WebDeviceProximityListener.
    virtual void didChangeDeviceProximity(const WebDeviceProximityData&) override;

    virtual void trace(Visitor*) override;

private:
    DeviceProximityDispatcher();

    // Inherited from PlatformEventDispatcher.
    virtual void startListening() override;
    virtual void stopListening() override;

    Member<DeviceProximityData> m_lastDeviceProximityData;
};

} // namespace blink

#endif // DeviceProximityDispatcher_h
