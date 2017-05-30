var    redis = require('redis')
     ,    client = redis.createClient()
     ;
// отлавливаем ошибки
client.on("error", function (err) {
  console.log("Error: " + err);
});

// Попробуем записать и прочитать
client.set('myKey', 'Hello Redis', function (err, repl) {
    if (err) {
           // Оо что то случилось при записи
           console.log('Что то случилось при записи: ' + err);
           client.quit();
    } else {
           // Прочтем записанное
           client.get('myKey', function (err, repl) {
                   //Закрываем соединение, так как нам оно больше не нужно
                   client.quit();
                   if (err) {
                           console.log('Что то случилось при чтении: ' + err);
                   } else if (repl) {
                   // Ключ найден
                           console.log('Ключ: ' + repl);
               } else {
                   // Ключ ненайден
                   console.log('Ключ ненайден.')

           };
           });
    };
});