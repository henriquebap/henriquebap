<!-- Imagens em assets/ (geradas por .github/marca.mjs) e o cartão de atividade (.github/atividade.mjs):
     o workflow profile.yml publica tudo na branch output, em versão escura e clara. -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/henriquebap/henriquebap/output/header-dark.svg" />
  <img src="https://raw.githubusercontent.com/henriquebap/henriquebap/output/header-light.svg" alt="Henrique Baptista · AI Engineer · LLM-as-Judge, Evals, ASR, Product Engineer" width="100%" />
</picture>

<p>
  <a href="https://henriquebap.com/sobre"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/henriquebap/henriquebap/output/btn-site-dark.svg" /><img src="https://raw.githubusercontent.com/henriquebap/henriquebap/output/btn-site-light.svg" alt="henriquebap.com" height="34" /></picture></a>
  <a href="https://www.linkedin.com/in/henriqueobaptista/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/henriquebap/henriquebap/output/btn-linkedin-dark.svg" /><img src="https://raw.githubusercontent.com/henriquebap/henriquebap/output/btn-linkedin-light.svg" alt="LinkedIn" height="34" /></picture></a>
  <a href="mailto:henrique.obap@gmail.com"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/henriquebap/henriquebap/output/btn-email-dark.svg" /><img src="https://raw.githubusercontent.com/henriquebap/henriquebap/output/btn-email-light.svg" alt="Email" height="34" /></picture></a>
  <a href="https://henriquebap.com/sobre"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/henriquebap/henriquebap/output/btn-open-dark.svg" /><img src="https://raw.githubusercontent.com/henriquebap/henriquebap/output/btn-open-light.svg" alt="Open to AI Engineer roles" height="34" /></picture></a>
</p>

At a HealthTech I built the **evaluation for medical AI**, up to **LLM-as-Judge in production**. Today I build **HOB Oficina** on my own: the system auto mechanic shops run on, with **agents, voice and WhatsApp** inside it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/henriquebap/henriquebap/output/atividade-dark.svg" />
  <img src="https://raw.githubusercontent.com/henriquebap/henriquebap/output/atividade-light.svg" alt="Country, on GitHub since, contributions, current and longest streak, repositories worked on, contributions per year and languages" width="100%" />
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/henriquebap/henriquebap/output/snake-dark.svg" />
  <img src="https://raw.githubusercontent.com/henriquebap/henriquebap/output/snake-light.svg" alt="Snake eating the contribution graph" width="100%" />
</picture>

## What I build

| Project | What it is |
|---|---|
| **[HOB Oficina](https://henriquebap.com/oficina)** · own product | The system an auto mechanic shop runs on every day, now multi-tenant. Agents with typed tools, Jev for typed judgments, guardrails and confirmations decided in code. |
| **[Medical AI](https://henriquebap.com/sobre#medical-asr)** · VOA Health, 2025–2026 | Streaming ASR experiments, medication-first evaluation of ASR providers, and LLM-as-Judge evaluators in production, calibrated against human annotators. |
| **[WordinAI](https://wordinai.com)** · live SaaS, solo | A deep agent (deepagents / LangGraph) that turns long audio into sourced documents: hybrid search, citations assembled in code, model routing by task. |

Those three run in private repositories. Architecture and trade-offs: **[henriquebap/ai-portfolio](https://github.com/henriquebap/ai-portfolio)** and **[henriquebap.com/sobre](https://henriquebap.com/sobre)**.

## Public ML projects

| Area | Project | What it shows |
|---|---|---|
| Applied ML | [Education Risk Prediction](https://github.com/henriquebap/datathon-educacao-passos-magicos) · [live](https://henriquebap-datathon-educacao-passos-magicos.hf.space) | XGBoost, FastAPI and a Streamlit dashboard for an education NGO, with Evidently drift monitoring. 92.59% accuracy on held-out data. |
| Computer vision | [Insurance Computer Vision](https://github.com/henriquebap/R-CNN-OD-Sprint) | Detectron2 / Mask R-CNN on a dataset built from scratch. Top-10 finalist in the Porto Seguro challenge. |
| Computer vision | [Marine Vision Systems](https://github.com/henriquebap/Blue-Clean-YoloV9) · [YOLOv5](https://github.com/henriquebap/YoloV5-Shark-Detection) | YOLOv9 for marine waste, YOLOv5 for marine animals. |
| Embeddings | [Genetic Syndrome Classification](https://github.com/henriquebap/Genetic_Syndrome_Classification_w_Embeddings_KNN) | KNN over 320-dimensional image embeddings, t-SNE, multi-metric evaluation. |
| Time series | [Experimental Stock Forecasting](https://github.com/henriquebap/previsao_acoes) | PyTorch + FastAPI whose monitoring exposed weak generalization, kept public as an honest experiment. |

## Toolbox

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://skillicons.dev/icons?i=python%2Cpytorch%2Csklearn%2Cfastapi%2Cpostgres%2Csupabase%2Cdocker%2Caws%2Cgithubactions%2Cts%2Cjs%2Creact%2Cnextjs%2Cnodejs%2Ctailwind%2Cvite%2Csentry&perline=9&theme=dark" />
  <img src="https://skillicons.dev/icons?i=python,pytorch,sklearn,fastapi,postgres,supabase,docker,aws,githubactions,ts,js,react,nextjs,nodejs,tailwind,vite,sentry&perline=9&theme=light" alt="Python, PyTorch, scikit-learn, FastAPI, Postgres, Supabase, Docker, AWS, GitHub Actions, TypeScript, JavaScript, React, Next.js, Node.js, Tailwind, Vite, Sentry" />
</picture>

| Area | Tools |
|---|---|
| **Evaluate** | LLM-as-Judge · LangSmith · evaluation datasets · WER / CER (jiwer) · Argilla · human calibration (Cohen's κ) · failure analysis |
| **Agents & LLMs** | OpenAI Agents SDK · LangGraph / deepagents · Jev (TypeSafe) · MCP · RAG and hybrid search · pgvector · prompt caching and model routing |
| **Model** | PyTorch · Hugging Face · Whisper · VAD and segmentation · scikit-learn · XGBoost · Detectron2 / YOLO |
| **Build** | Python · FastAPI · TypeScript · Next.js · Supabase / Postgres (RLS) · Zod · Streamlit / Gradio |
| **Operate** | Docker · AWS (S3, EC2) · Railway · GitHub Actions · Sentry / PostHog · Prometheus · Evidently |
