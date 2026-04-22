# Guía de Instalación del Cascarón y OpenCode + Gentle AI

Para aprovechar al máximo este "cascarón" (boilerplate), necesitas instalar **OpenCode** (el agente de código) y **Gentle AI** (el orquestador de memoria, skills y flujo SDD).

## 1. Instalar Gentle AI (AI Gentle Stack)

Gentle AI es el ecosistema que le da memoria persistente, habilidades (skills) y el flujo de Spec-Driven Development (SDD) a tus agentes de IA.

### macOS / Linux
```bash
curl -fsSL https://raw.githubusercontent.com/Gentleman-Programming/gentle-ai/main/scripts/install.sh | bash
```
*(Alternativa recomendada con Homebrew)*:
```bash
brew tap Gentleman-Programming/homebrew-tap
brew install gentle-ai
```

### Windows
```powershell
scoop bucket add gentleman https://github.com/Gentleman-Programming/scoop-bucket
scoop install gentle-ai
```
*(Alternativa con script de PowerShell)*:
```powershell
irm https://raw.githubusercontent.com/Gentleman-Programming/gentle-ai/main/scripts/install.ps1 | iex
```

---

## 2. Configurar tu Proyecto

Una vez que tengas instalado Gentle AI y tu agente preferido (OpenCode, Claude Code, Cursor, etc.), abre una terminal en la raíz de este proyecto (`genericseed`) y ejecuta:

1. **Escanear las reglas del proyecto (Skills y Convenciones):**
   ```bash
   skill-registry
   ```
   *Esto lee la carpeta `.agent/` y genera el registro de habilidades y arquitectura para que el agente sepa cómo trabajar en este proyecto.*

2. **Inicializar el flujo SDD:**
   Abre tu agente de IA en la terminal (ej. ejecutando `opencode`) y envíale este mensaje:
   ```text
   /sdd-init
   ```
   *Esto detectará tu stack tecnológico y activará la memoria persistente de tu proyecto (Engram).*

---

## 3. Uso Recomendado (OpenCode + SDD)

Este cascarón está construido usando **Spec-Driven Development (SDD)**. Toda la arquitectura del Frontend (Next.js) y Backend (Django Ninja Extra) está documentada en la carpeta `.agent/lab/`.

Cuando quieras crear un nuevo módulo (por ejemplo, "Mesa de Partes"), **NO le pidas a la IA que escriba código directamente**. En su lugar, usa el flujo SDD:

1. Abre OpenCode en tu terminal.
2. Escribe: `/sdd-new módulo mesa de partes`
3. El orquestador de Gentle AI dividirá el trabajo en fases:
   - Explorará la arquitectura del cascarón (`.agent/lab/`).
   - Te propondrá un plan de acción.
   - Escribirá las especificaciones y el diseño técnico.
   - Generará las tareas.
   - Escribirá el código final respetando las capas Hexagonales y los patrones de TanStack Query definidos en este cascarón.