project(qt-cmake-project)
cmake_minimum_required(VERSION 3.0)
find_package(Qt5 COMPONENTS Core Widgets)

include_directories(${Qt5Core_INCLUDE_DIRS})
include_directories(${Qt5Widgets_INCLUDE_DIRS})
include_directories(${CMAKE_CURRENT_BINARY_DIR})

set (PROJECTNAME_ARCHITECTURE "x64")

set(SOURCES
    # tests/test1.c
    tests/test2.c
    src/Object.cpp
    src/Application.cpp
    src/Widget.cpp
    src/Layout.cpp
    src/PushButton.cpp
    src/Label.cpp
    )

set(MOC_HEADERS
    inc/Object.h
)

set(HEADERS
    tests/widgets.h
    inc/Layout.h
    inc/Application.h
    inc/Widget.h
    inc/PushButton.h
    inc/Label.h
)

qt5_wrap_cpp(MOC_SRC ${MOC_HEADERS})

add_executable(
    my_program
    ${SOURCES}
    ${HEADERS}
    ${MOC_SRC}
    )

add_definitions(-DQT_NO_KEYWORDS)

target_link_libraries(my_program
    ${Qt5Core_LIBRARIES}
    ${Qt5Widgets_LIBRARIES}
    )