// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "config.h"
#include "modules/device_proximity/DeviceProximityDispatcher.h"

#include "modules/device_proximity/DeviceProximityController.h"
#include "modules/device_proximity/DeviceProximityData.h"
#include "public/platform/Platform.h"

namespace blink {

DeviceProximityDispatcher& DeviceProximityDispatcher::instance()
{
    DEFINE_STATIC_LOCAL(Persistent<DeviceProximityDispatcher>, deviceProximityDispatcher, (new DeviceProximityDispatcher()));
    return *deviceProximityDispatcher;
}

DeviceProximityDispatcher::DeviceProximityDispatcher()
{
}

DeviceProximityDispatcher::~DeviceProximityDispatcher()
{
}

void DeviceProximityDispatcher::trace(Visitor* visitor)
{
    PlatformEventDispatcher::trace(visitor);
}

void DeviceProximityDispatcher::startListening()
{
    Platform::current()->startListening(WebPlatformEventDeviceProximity, this);

}

void DeviceProximityDispatcher::stopListening()
{
    Platform::current()->stopListening(WebPlatformEventDeviceProximity);
    m_lastDeviceProximityData.clear();
}

void DeviceProximityDispatcher::didChangeDeviceProximity(const WebDeviceProximityData& data)
{
    m_lastDeviceProximityData = DeviceProximityData::create(data);
    notifyControllers();
}

DeviceProximityData* DeviceProximityDispatcher::latestDeviceProximityData()
{
    return m_lastDeviceProximityData.get();
}

} // namespace blink
