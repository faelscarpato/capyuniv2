# C# / .NET no CapyUNI v2

Este documento descreve o suporte inicial para abrir, detectar e rodar projetos C# dentro do CapyUNI v2 usando o Runtime Local.

## Requisitos locais

- .NET SDK instalado na máquina.
- CapyUNI v2 rodando com o servidor PTY local.
- Runtime Local ativado no app.

## Como usar

1. Importe ou abra um workspace que contenha pelo menos um destes arquivos:
   - `.csproj`
   - `.sln`
   - `Program.cs`
2. Ative o Runtime Local.
3. Abra a Command Palette com `Ctrl+Shift+P`.
4. Execute uma das opções:
   - `.NET: Restaurar dependências`
   - `.NET: Build C#`
   - `.NET: Rodar projeto C#`
   - `.NET: Testar projeto C#`

## Regras de detecção

A detecção prioriza arquivos nesta ordem:

1. `.csproj`
2. `.sln`
3. `Program.cs`

Quando encontra um `.csproj`, o comando recomendado é:

```bash
dotnet run --project "caminho/Projeto.csproj"
```

Quando encontra apenas uma `.sln`, o comando de execução direta não é usado porque uma solução pode conter múltiplos projetos. Nesse caso, o CapyUNI usa build como fallback:

```bash
dotnet build "caminho/Solucao.sln"
```

## Observações

Este suporte não executa C# dentro do navegador. Ele usa o terminal real do Runtime Local, então os comandos rodam na máquina do usuário com o .NET SDK instalado.
