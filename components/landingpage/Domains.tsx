import Reveal from "./Reveal";
import ModelViewer, { type Model3D } from "./ModelViewer";
import CodeCanvas from "./CodeCanvas";
import "./Domains.css";

const MODELS: Model3D[] = [
  { url: "/assets/arduino_uno_-_low_poly.glb", name: "Arduino Uno" },
  { url: "/assets/esp8266.glb", name: "ESP8266" },
  { url: "/assets/RAM by iPoly3D - obBMPOGYvy.glb", name: "RAM Module" },
  { url: "/assets/raspberry_pi_3.glb", name: "Raspberry Pi 3" },
];

const C_SNIPPETS = [
  {
    title: "stack.c — LIFO push/pop",
    code: `#include <stdio.h>
#define CAP 8

int stack[CAP], top = -1;

void push(int v) {
    if (top == CAP - 1) return;
    stack[++top] = v;
}

int pop(void) {
    if (top == -1) return -1;
    return stack[top--];
}`,
  },
  {
    title: "queue.c — FIFO enqueue/dequeue",
    code: `#include <stdio.h>
#define CAP 8

int queue[CAP];
int front = 0, rear = 0;

void enqueue(int v) {
    if (rear == CAP) return;
    queue[rear++] = v;
}

int dequeue(void) {
    if (front == rear) return -1;
    return queue[front++];
}`,
  },
  {
    title: "list.c — nodes & linked list",
    code: `#include <stdlib.h>

typedef struct node {
    int data;
    struct node *next;
} node_t;

node_t *node_new(int v) {
    node_t *n = malloc(sizeof *n);
    n->data = v;
    n->next = NULL;
    return n;
}

/*  head -> [3] -> [7] -> [12] -> NULL  */`,
  },
  {
    title: "search.c — binary search",
    code: `#include <stdio.h>

int bsearch_(int a[], int n, int key) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (a[mid] == key) return mid;
        if (a[mid] < key) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}

/* O(log n) — array must be sorted */`,
  },
  {
    title: "bits.c — bitwise register flags",
    code: `#include <stdio.h>

#define SET(reg, bit)    ((reg) |=  (1u << (bit)))
#define CLEAR(reg, bit)  ((reg) &= ~(1u << (bit)))
#define CHECK(reg, bit)  (((reg) >> (bit)) & 1u)

int main(void) {
    unsigned char port = 0;
    SET(port, 3);
    SET(port, 5);
    CLEAR(port, 3);
    /* port = 0b00100000 */
    return CHECK(port, 5);
}`,
  },
];

export default function Domains() {
  return (
    <section id="domains" className="section section--tinted">
      <div className="container">
        <Reveal>
          <h2 className="section-title domains__title">What We Do</h2>
        </Reveal>

        {/* ---- Electronics: text left, canvas right ---- */}
        <Reveal delay={100} className="domain-split">
          <div className="domain-split__text">
            <span className="section-label">Electronics</span>
            <h3 className="domain-split__heading">From breadboard to firmware</h3>
            <p className="domain-split__copy">
              Embedded systems, IoT, circuit design, hardware prototyping. We work with
              microcontrollers, sensors and power electronics — dragging real parts into working
              builds, one solder joint at a time.
            </p>
            <p className="domain-split__hint">Drag the model to spin it</p>
          </div>
          <div className="domain-split__canvas">
            <ModelViewer models={MODELS} />
          </div>
        </Reveal>

        {/* ---- Computer Science: canvas left, text right (text first in DOM
             so mobile reads text -> canvas; desktop reorders via CSS) ---- */}
        <Reveal delay={100} className="domain-split domain-split--flip">
          <div className="domain-split__text">
            <span className="section-label">Computer Science</span>
            <h3 className="domain-split__heading">Algorithms you can watch run</h3>
            <p className="domain-split__copy">
              Web development, algorithms, open source, software engineering. From data structures
              in C to full-stack projects — we write it, break it, and rebuild it better.
            </p>
            <p className="domain-split__hint">Live C examples — stack, queue, linked list & more</p>
          </div>
          <div className="domain-split__canvas">
            <CodeCanvas snippets={C_SNIPPETS} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
