#include <QObject>
#include "../tests/widgets.h"
#include "../inc/Widget.h"
#include "../inc/Layout.h"

Widget::~Widget() {
    delete widget;
}

void Widget::InitWidget() {
    widget = new QWidget();
}

QWidget* Widget::GetWidget() {
    return widget;
}

void Widget::SetParent(Widget *p) {
    parent = p;
    if(p != NULL) {
        p->AddChild(this);
        widget->setParent(p->GetWidget());
    }
}

void Widget::SetWindowTitle(const char *title) {
    widget->setWindowTitle(title);
}

void Widget::SetSize(int w, int h) {
    widget->resize(w, h);
}

void Widget::SetVisible(bool v) {
    widget->setVisible(v);
}

void Widget::SetLayout(QLayout* layout) {
    widget->setLayout(layout);
}

//-------------------------------------------------------------------

Widget* InitWidget(Widget *widget, Widget *parent) {
    widget->InitWidget();
    widget->SetParent(parent);
    return widget;
}

struct Widget* Widget_New(Widget *parent) {
    Widget* widget = new Widget();
    return InitWidget(widget, parent);
}

void Widget_SetVisible(Widget *widget, bool v) {
    widget->SetVisible(v);
}

void Widget_SetWindowTitle(Widget *widget, const char *title) {
    widget->SetWindowTitle(title);
}

void Widget_SetLayout(Widget *widget, Layout *layout) {
    widget->SetLayout(layout->GetLayout());
}

void Widget_SetSize(Widget *widget, int w, int h) {
    widget->SetSize(w, h);
}
