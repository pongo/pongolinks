нужно добавить новую функцию: Проверка в wayback api

при создании/редактировании под полем ссылки показывается статус (наличие в wayback), предложение сохранить (если ссылки нет в архиве).

документация к апи (только обращаться нужно к https, а не к http, как у них в примере)
https://archive.org/help/wayback_api.php

примеры запросов:

```bash
$ curl https://archive.org/wayback/available?url=https://jayconrod.com/posts/133/integration-tests-are-best-tests
{"url": "https://jayconrod.com/posts/133/integration-tests-are-best-tests", "archived_snapshots": {"closest": {"status": "200", "available": true, "url": "http://web.archive.org/web/20260212061822/https://jayconrod.com/posts/133/integration-tests-are-best-tests", "timestamp": "20260212061822"}}}

$ curl https://archive.org/wayback/available?url=https://github.com/DrKain/tidy-url
{"url": "https://github.com/DrKain/tidy-url", "archived_snapshots": {"closest": {"status": "200", "available": true, "url": "http://web.archive.org/web/20260311082645/https://github.com/DrKain/tidy-url", "timestamp": "20260311082645"}}}

$ curl https://archive.org/wayback/available?url=https://www.youtube.com/watch?v=_sOjKkBIlys
{"url": "https://www.youtube.com/watch?v=_sOjKkBIlys", "archived_snapshots": {}}
```

нужно обратить внимание, что апи нестабильное. может возвращать 429. в случае подобных ошибок НЕ нужно заново отправлять запросы. просто в тексте под полем ввода обозначить ошибку.
