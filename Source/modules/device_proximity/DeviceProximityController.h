// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef DeviceProximityController_h
#define DeviceProximityController_h

#include "core/dom/DocumentSupplementable.h"
#include "core/frame/DeviceSingleWindowEventController.h"

namespace blink {

class DeviceProximityData;
class Event;

class DeviceProximityController final : public DeviceSingleWindowEventController, public DocumentSupplement {
    WILL_BE_USING_GARBAGE_COLLECTED_MIXIN(DeviceProximityController);
public:
    virtual ~DeviceProximityController();

    static const char* supplementName();
    static DeviceProximityController& from(Document&);

    virtual void trace(Visitor*) override;

private:
    explicit DeviceProximityController(Document&);

    // Inherited from DeviceEventControllerBase.
    virtual void registerWithDispatcher() override;
    virtual void unregisterWithDispatcher() override;
    virtual bool hasLastData() override;

    // Inherited from DeviceSingleWindowEventController.
    virtual PassRefPtrWillBeRawPtr<Event> lastEvent() const override;
    virtual const AtomicString& eventTypeName() const override;
    virtual bool isNullEvent(Event*) const override;

    PersistentWillBeMember<DeviceProximityData> m_overrideProximityData;
};

} // namespace blink

#endif // DeviceProximityController_h
