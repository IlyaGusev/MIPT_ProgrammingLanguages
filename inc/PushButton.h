#pragma once
#include "Widget.h"

class PushButton : public Widget {
public:
    virtual void InitWidget();

    void SetText(const char* text);
    void SetOnClicked(NoArgumentsCallback *callback);
};