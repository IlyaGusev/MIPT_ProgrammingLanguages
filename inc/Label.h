#pragma once
#include "Widget.h"

class Label : public Widget {
public:
    virtual void InitWidget();

    void SetText(const char* text);
};
