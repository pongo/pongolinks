/grill docs

спланируй v0.6

First read:

- CONTEXT.md
- docs/adr/0001-monorepo-with-single-backend-entrypoint.md
- docs/adr/0002-value-objects-for-validated-domain-primitives.md
- docs/adr/0003-evlog-wide-events-for-backend-observability.md
- .scratch/v0.1/IMPLEMENTATION_PLAN.md
- .scratch/v0.2/IMPLEMENTATION_PLAN.md
- .scratch/v0.3/IMPLEMENTATION_PLAN.md
- .scratch/v0.4/IMPLEMENTATION_PLAN.md
- .scratch/v0.5/IMPLEMENTATION_PLAN.md

Goal:
нужно добавить автодополнение тегов при создании/редактировании закладки:

- поле ввода тегов остается простым текстовым полем
- но когда пользователь начинает вводить название тега, то снизу появляется список тегов, отсортированный по популярности тега
- сложные fuzzy поиски не нужны, но искомое сочетание может быть в любом месте тега
- максимум список из 7 тегов
- теги выбираются кликом мышки или стрелочками на клавиатуре
- таб или энтер выбирают тег
- эскейп или пробел закрывают список тегов без выбора тега; клавиша пробела еще добавляет символ пробел в поле ввода
- выбрав один тег пользователь может ввести пробел и когда он начнет набирать новый тег, то снова появится автодополнение
- выглядеть может как скриншот во вложении, но это просто идея, не нужно копировать (иконка ярлыка, например, совсем лишняя)

Please:

- clarify v0.6 scope so it stays small;
- challenge ideas against CONTEXT.md and existing ADRs;
- ask one question at a time and include your recommended answer;
- update CONTEXT.md inline if we clarify domain terms;
- propose an ADR only if the decision is hard to reverse, surprising without context, and has a real trade-off;
- create .scratch/v0.6/IMPLEMENTATION_PLAN.md after the scope is agreed;
- after I approve the plan, split it into issues under .scratch/v0.6/issues/;
- at the end of the Implementation Plan, include a one-line Conventional Commits commit message in English.
