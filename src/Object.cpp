#include <typeinfo>
#include <cxxabi.h>
#include <memory>
#include <string.h>
#include <iostream>

#include "../tests/widgets.h"
#include "../inc/Object.h"

static std::string demangle(const char* name) {
    
    int status = -4;
    std::unique_ptr<char, void(*)(void*)> res {
        abi::__cxa_demangle(name, NULL, NULL, &status),
        std::free
    };

    return (status==0) ? res.get() : name;
}

const char* Object::GetClassName() {
    name = demangle(typeid(*this).name());
    return name.c_str();
}

Object::~Object() {
    for(auto & child : children) {
        delete child;
    }
}

void Object::AddChild(Object* object) {
    children.push_back(object);
}

void Object::SetHandler(NoArgumentsCallback *c, Object* s) {
    callback = c;
    callbackSender = s;
}

void Object::handleClick() {
    if(callback != 0) {
        (*callback)(callbackSender);
    } else {
        std::cout << "No callback was found" << std::endl;
    }
}

//----------------------------------------------------

const char* Object_GetClassName(Object *object) {
    return object->GetClassName();
}

void Object_Delete(Object *object) {
    delete object;
}
