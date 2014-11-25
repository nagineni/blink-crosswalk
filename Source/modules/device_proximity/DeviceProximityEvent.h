// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef DeviceProximityEvent_h
#define DeviceProximityEvent_h

#include "modules/EventModules.h"
#include "platform/heap/Handle.h"

namespace blink {

class DeviceProximityData;

struct DeviceProximityEventInit : public EventInit {
    DeviceProximityEventInit()
        : value(std::numeric_limits<double>::infinity())
    {
        bubbles = true;
    };

    double value;
    double min;
    double max;
};

class DeviceProximityEvent final : public Event {
    DEFINE_WRAPPERTYPEINFO();
public:
    virtual ~DeviceProximityEvent();

    static PassRefPtrWillBeRawPtr<DeviceProximityEvent> create()
    {
        return adoptRefWillBeNoop(new DeviceProximityEvent);
    }
    static PassRefPtrWillBeRawPtr<DeviceProximityEvent> create(const AtomicString& eventType, DeviceProximityData* proximity)
    {
        return adoptRefWillBeNoop(new DeviceProximityEvent(eventType, proximity));
    }

    static PassRefPtrWillBeRawPtr<DeviceProximityEvent> create(const AtomicString& eventType, const DeviceProximityEventInit& initializer)
    {
        return adoptRefWillBeNoop(new DeviceProximityEvent(eventType, initializer));
    }

    DeviceProximityData* proximity_data() const { return m_proximity.get(); }

    double value() const;
    double min() const;
    double max() const;

    virtual const AtomicString& interfaceName() const override;

private:
    DeviceProximityEvent();
    DeviceProximityEvent(const AtomicString& eventType, DeviceProximityData*);
    DeviceProximityEvent(const AtomicString& eventType, const DeviceProximityEventInit& initializer);

    PersistentWillBeMember<DeviceProximityData> m_proximity;
};

DEFINE_TYPE_CASTS(DeviceProximityEvent, Event, event, event->interfaceName() == EventNames::DeviceProximityEvent, event.interfaceName() == EventNames::DeviceProximityEvent);

} // namespace blink

#endif // DeviceProximityEvent_h
