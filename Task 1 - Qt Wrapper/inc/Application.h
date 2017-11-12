#pragma once
#include <QApplication>

#include "Object.h"

class Application : public Object {
public:
    Application(int argc, char *argv[]) : app(argc, argv) {}
    
    int Execute();

private:
    QApplication app;
};
