# Project-Specific Architectural Core (`.lab-project`)

This directory is part of the **Two-Layer Reading Protocol**.

While `../.lab/` contains the **Generic Core** (framework rules, global contracts, tech-agnostic patterns), this `.lab-project/` directory contains the **Project-Specific Core**.

It dictates **WHAT** the application actually does, its constraints, and the custom rules for its specific business domains.

## Structure

- **`domain/`**: Contains business rules, user definitions, pricing strategies, workflows, and everything that constitutes the Domain Knowledge.
- **`active-change/`**: Used by the SDD pipeline to hold temporary spec and design documents for the CURRENT feature being developed.

## When to use this

- Agents will read docs from `domain/` **before** writing proposals (`sdd-propose`) or specifications (`sdd-spec`).
- If you discover a new business rule during implementation, you should document it in `domain/` rather than the generic `.lab/`.
