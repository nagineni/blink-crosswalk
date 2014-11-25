/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#include "config.h"
#include "modules/device_proximity/DeviceProximityData.h"
#include "public/platform/WebDeviceProximityData.h"

namespace blink {

DeviceProximityData* DeviceProximityData::create()
{
    return new DeviceProximityData;
}

DeviceProximityData* DeviceProximityData::create(double value, double min, double max)
{
    return new DeviceProximityData(value, min, max);
}

DeviceProximityData* DeviceProximityData::create(const WebDeviceProximityData& data)
{
    return DeviceProximityData::create(data.value, data.min, data.max);
}

DeviceProximityData::DeviceProximityData()
    : m_value(std::numeric_limits<double>::infinity())
    , m_min(std::numeric_limits<double>::infinity())
    , m_max(std::numeric_limits<double>::infinity())
{
}

DeviceProximityData::DeviceProximityData(double value, double min, double max)
    : m_value(value)
    , m_min(min)
    , m_max(max)
{
}

} // namespace blink
