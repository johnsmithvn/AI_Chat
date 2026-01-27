1️⃣ CẤU TRÚC DỰ ÁN (PROJECT STRUCTURE)
======================================

```text
ai-core/
├─ app/
│  ├─ api/                 # HTTP / WS interface
│  │  └─ chat.py
│  ├─ core/                # AI CORE (não)
│  │  ├─ engine.py         # entry point của AI core
│  │  ├─ context.py        # phân tích ngữ cảnh
│  │  ├─ persona.py        # chọn giọng / hành vi
│  │  ├─ prompt.py         # build prompt
│  │  ├─ output.py         # xử lý output
│  ├─ memory/
│  │  ├─ short_term.py
│  │  ├─ long_term.py
│  │  └─ schema.py
│  ├─ tools/
│  │  ├─ router.py
│  │  └─ base.py
│  ├─ model/
│  │  └─ client.py         # gọi base model
│  └─ config/
│     ├─ persona.yaml
│     ├─ rules.yaml
│     └─ system.yaml
│
├─ data/
│  ├─ memory.db            # SQLite
│  └─ logs.db
│
├─ tests/
│  └─ long_chat.yaml
│
└─ main.py
```

👉 **Đổi model / thêm tool / thêm modality → không đụng core/**

* * *

2️⃣ SCHEMA (RÕ – TỐI THIỂU – ĐỦ DÙNG)
=====================================

2.1 Conversation Schema
-----------------------

```json
{
  "id": "uuid",
  "role": "user | assistant | system",
  "content": "string",
  "persona": "casual | technical | cautious",
  "timestamp": "iso-8601"
}
```

* * *

2.2 Memory Schema
-----------------

```json
{
  "id": "uuid",
  "type": "short_term | long_term | knowledge",
  "content": "string",
  "confidence": 0.0,
  "source": "user | doc | system",
  "created_at": "iso-8601"
}
```

* * *

2.3 Tool Call Schema
--------------------

```json
{
  "tool": "string",
  "input": {},
  "output": {},
  "status": "success | failed"
}
```

* * *

3️⃣ CÔNG NGHỆ SỬ DỤNG
=====================

| Thành phần | Công nghệ |
| --- | --- |
| Ngôn ngữ | Python 3.11 |
| API | FastAPI |
| Model serving | llama.cpp / vLLM / external API |
| Database | SQLite |
| Vector DB (sau) | FAISS |
| Config | YAML |
| Logging | structlog |

* * *

4️⃣ THƯ VIỆN CẦN DÙNG
=====================

```txt
fastapi
uvicorn
pydantic
sqlalchemy
pyyaml
structlog
httpx
```

📌 **KHÔNG dùng langchain lúc đầu**  
📌 Core phải **thuần, dễ kiểm soát**

* * *

5️⃣ TASK & CHỨC NĂNG CẦN LÀM (CHECKLIST)
========================================

Core bắt buộc
-------------

*    Context analyzer (rule-based)
*    Persona selector
*    Prompt builder
*    Memory read/write
*    Output validation
*    Logging + trace

Hạ tầng
-------

*    Model client abstraction
*    Config loader
*    Session handling

Chuẩn bị mở rộng
----------------

*    Tool router interface
*    Vector DB interface (stub)
*    Modality hook (image / audio – stub)

* * *

6️⃣ LUỒNG XỬ LÝ (FLOW RÕ RÀNG)
==============================

```text
User Input
   ↓
Context Analyzer
   ↓
Persona Selector
   ↓
Memory Loader
   ↓
Prompt Builder
   ↓
Model Client
   ↓
Output Processor
   ↓
Memory Update
   ↓
Response
```