#pragma once
#include <QLayout>
#include "Object.h"

struct Layout : public Object {
    Layout() : layout(0) {}
    ~Layout();

    virtual void InitLayout() = 0;
    void SetParent(Widget *p);
    void AddWidget(QWidget* widget);

    QLayout* GetLayout();

protected: 
    QLayout* layout;
};

//----------------------------------------------

struct VBoxLayout : public Layout {
    virtual void InitLayout();
};