// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "config.h"
#include "modules/device_proximity/DeviceProximityEvent.h"

#include "modules/device_proximity/DeviceProximityData.h"

namespace blink {

DeviceProximityEvent::~DeviceProximityEvent()
{
}

DeviceProximityEvent::DeviceProximityEvent()
    : m_proximity(DeviceProximityData::create())
{
}

DeviceProximityEvent::DeviceProximityEvent(const AtomicString& eventType, DeviceProximityData* proximity)
    : Event(eventType, true, false) // The DeviceProximityEvent bubbles but is not cancelable.
    , m_proximity(proximity)
{
}

DeviceProximityEvent::DeviceProximityEvent(const AtomicString& eventType, const DeviceProximityEventInit& initializer)
    : Event(eventType, initializer)
    , m_proximity(DeviceProximityData::create(initializer.value, initializer.min, initializer.max))
{
}

const AtomicString& DeviceProximityEvent::interfaceName() const
{
    return EventNames::DeviceProximityEvent;
}

double DeviceProximityEvent::value() const
{
    return m_proximity->value();
}

double DeviceProximityEvent::min() const
{
    return m_proximity->min();
}

double DeviceProximityEvent::max() const
{
    return m_proximity->max();
}

} // namespace blink




