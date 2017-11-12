#pragma once
#include <QWidget>
#include "Object.h"

class Widget : public Object {
public:
    Widget() : widget(0), parent(0) {}

    virtual void InitWidget();
    QWidget* GetWidget();

    void SetWindowTitle(const char *title);
    void SetSize(int w, int h);
    void SetVisible(bool v);
    void SetParent(Widget *parent);
    void SetLayout(QLayout* layout);

    virtual ~Widget();

protected:
    QWidget* widget;
    Widget* parent;
};

//---------------------------------------------------------------

Widget* InitWidget(Widget *widget, Widget *parent);
