#include "../tests/widgets.h"
#include "../inc/Layout.h"
#include "../inc/Widget.h"

Layout::~Layout() {
    delete layout;
}

void Layout::SetParent(Widget *p) {
    if(p != NULL) {
        p->AddChild(this);
        layout->setParent(p->GetWidget());
    }
}

void Layout::AddWidget(QWidget* widget) {
    layout->addWidget(widget);
}

QLayout* Layout::GetLayout() {
    return layout;
}

//----------------------------------------------------------------

void VBoxLayout::InitLayout() {
    layout = new QVBoxLayout();
}

//----------------------------------------------------------------

struct VBoxLayout* VBoxLayout_New(struct Widget *parent) {
    VBoxLayout* layout = new VBoxLayout();
    layout->InitLayout();
    layout->SetParent(parent);
    return layout;
}

void Layout_AddWidget(struct Layout *layout, struct Widget *widget) {
    layout->AddWidget(widget->GetWidget());
}
