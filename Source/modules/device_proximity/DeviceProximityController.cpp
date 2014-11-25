// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "config.h"
#include "modules/device_proximity/DeviceProximityController.h"

#include "core/dom/Document.h"
#include "modules/EventModules.h"
#include "modules/device_proximity/DeviceProximityData.h"
#include "modules/device_proximity/DeviceProximityDispatcher.h"
#include "modules/device_proximity/DeviceProximityEvent.h"
#include "platform/RuntimeEnabledFeatures.h"

namespace blink {

DeviceProximityController::DeviceProximityController(Document& document)
    : DeviceSingleWindowEventController(document)
{
}

DeviceProximityController::~DeviceProximityController()
{
#if !ENABLE(OILPAN)
    stopUpdating();
#endif
}

const char* DeviceProximityController::supplementName()
{
    return "DeviceProximityController";
}

DeviceProximityController& DeviceProximityController::from(Document& document)
{
    DeviceProximityController* controller = static_cast<DeviceProximityController*>(DocumentSupplement::from(document, supplementName()));
    if (!controller) {
        controller = new DeviceProximityController(document);
        DocumentSupplement::provideTo(document, supplementName(), adoptPtrWillBeNoop(controller));
    }
    return *controller;
}

bool DeviceProximityController::hasLastData()
{
    return DeviceProximityDispatcher::instance().latestDeviceProximityData();
}

void DeviceProximityController::registerWithDispatcher()
{
    DeviceProximityDispatcher::instance().addController(this);
}

void DeviceProximityController::unregisterWithDispatcher()
{
    DeviceProximityDispatcher::instance().removeController(this);
}

PassRefPtrWillBeRawPtr<Event> DeviceProximityController::lastEvent() const
{
    return DeviceProximityEvent::create(eventTypeName(),
        DeviceProximityDispatcher::instance().latestDeviceProximityData());
}

bool DeviceProximityController::isNullEvent(Event* event) const
{
    DeviceProximityEvent* proximityEvent = toDeviceProximityEvent(event);
    return proximityEvent->proximity_data()->value() == std::numeric_limits<double>::infinity();
}

const AtomicString& DeviceProximityController::eventTypeName() const
{
    return EventTypeNames::deviceproximity;
}

void DeviceProximityController::trace(Visitor* visitor)
{
    visitor->trace(m_overrideProximityData);
    DeviceSingleWindowEventController::trace(visitor);
    DocumentSupplement::trace(visitor);
}


} // namespace blink
