#include <QLabel>
#include "../tests/widgets.h"
#include "../inc/Label.h"

void Label::InitWidget() {
    widget = new QLabel();
}

void Label::SetText(const char* text) {
    dynamic_cast<QLabel*>(widget)->setText(text);
}

//-------------------------------------------------------------------

struct Label* Label_New(Widget *parent) {
    Widget* widget = new Label();
    return dynamic_cast<Label*>(InitWidget(widget, parent));
}
void Label_SetText(Label *label, const char *text) {
    label->SetText(text);
}
