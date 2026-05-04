const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    port: parseInt(process.env.DB_PORT) || 3306
  });
}

async function initDatabase() {
  let conn;
  try {
    conn = await createConnection();
    console.log('Connected to MySQL');

    await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE ${process.env.DB_NAME}`);
    console.log(`Database '${process.env.DB_NAME}' ready`);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`groups\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'teacher') NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        middle_name VARCHAR(100),
        group_id INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS theory_topics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        short_content TEXT NOT NULL,
        file_path VARCHAR(255),
        order_num INT DEFAULT 0
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS mini_tests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        topic_id INT NOT NULL,
        question TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
        FOREIGN KEY (topic_id) REFERENCES theory_topics(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS full_tests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
        topic_id INT NULL,
        FOREIGN KEY (topic_id) REFERENCES theory_topics(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        score INT NOT NULL,
        total_questions INT NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        test_type ENUM('mini', 'full') NOT NULL,
        topic_id INT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (topic_id) REFERENCES theory_topics(id) ON DELETE SET NULL
      )
    `);

    const saltRounds = 10;

    const [existingTeacher] = await conn.query('SELECT id FROM users WHERE username = ?', ['admin']);
    if (existingTeacher.length === 0) {
      const hashedPassword = await bcrypt.hash('teacher123', saltRounds);
      await conn.query(
        `INSERT INTO users (username, password, role, first_name, last_name, middle_name) VALUES (?, ?, 'teacher', 'Администратор', 'Преподаватель', 'Главный')`,
        ['admin', hashedPassword]
      );
      console.log('Teacher account created: admin / teacher123');
    }

    const [topicsCount] = await conn.query('SELECT COUNT(*) as count FROM theory_topics');
    if (topicsCount[0].count === 0) {
      const topics = [
        [
          'Тема 1. Оперативная память',
          `<h3>Оперативная память</h3>
<p>Оперативная память (RAM — Random Access Memory) — энергозависимая память, используемая для временного хранения данных и программ, с которыми процессор работает в текущий момент.</p>
<h4>Типы RAM:</h4>
<ul>
<li><strong>SRAM (Static RAM)</strong> — используется в кэш-памяти, быстрее, дороже, меньше ёмкость</li>
<li><strong>DRAM (Dynamic RAM)</strong> — используется как основная память, требует периодической регенерации</li>
</ul>
<h4>Поколения DDR:</h4>
<ul>
<li><strong>DDR</strong> — 200-400 МГц</li>
<li><strong>DDR2</strong> — 400-1066 МГц</li>
<li><strong>DDR3</strong> — 800-2133 МГц</li>
<li><strong>DDR4</strong> — 2133-3200 МГц</li>
<li><strong>DDR5</strong> — 4800-8400+ МГц</li>
</ul>
<h4>Характеристики:</h4>
<ul>
<li>Объём (4, 8, 16, 32, 64 ГБ)</li>
<li>Частота (МГц)</li>
<li>Тайминги (задержки, например CL16)</li>
<li>Пропускная способность (ГБ/с)</li>
</ul>`,
          'files/theme1_memory.docx', 1
        ],
        [
          'Тема 2. Кеш-память',
          `<h3>Кеш-память</h3>
<p>Кеш-память — это высокоскоростная память, используемая процессором для временного хранения часто используемых данных и команд.</p>
<h4>Уровни кеш-памяти:</h4>
<ul>
<li><strong>L1 Cache</strong> — встроен в ядро процессора, самый быстрый (2-64 КБ на ядро)</li>
<li><strong>L2 Cache</strong> — может быть на ядро или общим (256 КБ - 8 МБ)</li>
<li><strong>L3 Cache</strong> — общий для всех ядер (4-64 МБ)</li>
</ul>
<h4>Принцип работы:</h4>
<ul>
<li>Хранит копии данных из оперативной памяти</li>
<li>При попадании (cache hit) данные считываются быстро</li>
<li>При промахе (cache miss) данные загружаются из RAM</li>
</ul>`,
          'files/theme2_cache.ppt', 2
        ],
        [
          'Тема 3. Накопители',
          `<h3>Накопители</h3>
<p>Накопители (HDD, SSD) — устройства для долговременного хранения данных.</p>
<h4>Жёсткие диски (HDD):</h4>
<ul>
<li>Принцип работы: магнитная запись на вращающиеся пластины</li>
<li>Скорость вращения: 5400, 7200, 10000, 15000 об/мин</li>
<li>Ёмкость: до 20+ ТБ</li>
<li>Интерфейсы: SATA, SAS</li>
</ul>
<h4>Твердотельные накопители (SSD):</h4>
<ul>
<li>Основаны на NAND Flash памяти</li>
<li>Типы памяти: SLC, MLC, TLC, QLC</li>
<li>Интерфейсы: SATA, NVMe (PCIe)</li>
<li>Преимущества: высокая скорость, бесшумность, ударопрочность</li>
<li>Недостатки: ограниченное число циклов записи</li>
</ul>`,
          'files/theme3_hdd.ppt', 3
        ],
        [
          'Тема 4. Системы RAID',
          `<h3>Системы RAID</h3>
<p>RAID (Redundant Array of Independent Disks) — технология объединения нескольких дисков для повышения надежности или производительности.</p>
<h4>Основные уровни RAID:</h4>
<ul>
<li><strong>RAID 0</strong> — чередование (striping), высокая скорость, нет отказоустойчивости</li>
<li><strong>RAID 1</strong> — зеркалирование (mirroring), полная копия данных, высокая надежность</li>
<li><strong>RAID 5</strong> — чередование с чётностью, нужно минимум 3 диска</li>
<li><strong>RAID 10</strong> — комбинация RAID 1+0, быстро и надёжно</li>
</ul>
<h4>Программный vs аппаратный RAID:</h4>
<ul>
<li><strong>Программный</strong> — реализован средствами ОС, дешевле</li>
<li><strong>Аппаратный</strong> — отдельный RAID-контроллер, производительнее</li>
</ul>`,
          'files/theme4_raid.doc', 4
        ]
      ];

      for (const t of topics) {
        await conn.query('INSERT INTO theory_topics (title, short_content, file_path, order_num) VALUES (?, ?, ?, ?)', t);
      }
      console.log('Theory topics created');
    }

    const [miniCount] = await conn.query('SELECT COUNT(*) as count FROM mini_tests');
    if (miniCount[0].count === 0) {
      const miniTests = [
        [1, 'Что такое запоминающее устройство (ЗУ)?', 'Устройство для вывода данных', 'Устройство для хранения данных и программ', 'Устройство для обработки данных', 'Устройство для передачи данных', 'B'],
        [1, 'Какой тип памяти является самым быстрым?', 'Оперативная память', 'Кэш-память', 'Регистры процессора', 'Жёсткий диск', 'C'],
        [1, 'Что означает «энергонезависимость» памяти?', 'Быстрый доступ к данным', 'Сохранение данных при отключении питания', 'Возможность перезаписи', 'Большая ёмкость', 'B'],
        [1, 'Какой параметр НЕ является характеристикой ЗУ?', 'Ёмкость', 'Быстродействие', 'Цвет корпуса', 'Энергонезависимость', 'C'],
        [2, 'Что означает аббревиатура RAM?', 'Read Access Memory', 'Random Access Memory', 'Rapid Access Module', 'Real Auto Memory', 'B'],
        [2, 'Какой тип RAM используется в кэш-памяти?', 'DRAM', 'SRAM', 'Flash', 'ROM', 'B'],
        [2, 'Какое поколение DDR имеет частоту до 3200 МГц?', 'DDR2', 'DDR3', 'DDR4', 'DDR5', 'C'],
        [2, 'Что такое тайминги в RAM?', 'Частота работы', 'Задержки при обращении к памяти', 'Объём памяти', 'Напряжение питания', 'B'],
        [3, 'Какой тип ПЗУ можно стереть ультрафиолетом?', 'PROM', 'EPROM', 'EEPROM', 'Flash', 'B'],
        [3, 'Где хранится BIOS?', 'На HDD', 'В RAM', 'Во Flash-памяти на материнской плате', 'На DVD', 'C'],
        [3, 'Какой тип Flash-памяти используется в SSD?', 'NOR Flash', 'NAND Flash', 'PROM', 'SRAM', 'B'],
        [3, 'Что выполняет POST при загрузке?', 'Загружает ОС', 'Проверяет аппаратное обеспечение', 'Форматирует диск', 'Обновляет драйверы', 'B'],
        [4, 'Какова максимальная ёмкость HDD?', 'До 500 ГБ', 'До 2 ТБ', 'До 20+ ТБ', 'До 100 ТБ', 'C'],
        [4, 'Какой интерфейс обеспечивает наибольшую скорость для SSD?', 'SATA', 'USB 2.0', 'NVMe (PCIe)', 'IDE', 'C'],
        [4, 'Какой тип памяти SSD имеет наименьший ресурс записи?', 'SLC', 'MLC', 'TLC', 'QLC', 'D'],
        [4, 'Какова ёмкость стандартного DVD диска?', '700 МБ', '4.7 ГБ', '25 ГБ', '100 ГБ', 'B'],
      ];
      for (const t of miniTests) {
        await conn.query('INSERT INTO mini_tests (topic_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)', t);
      }
      console.log('Mini tests created');
    }

    const [fullCount] = await conn.query('SELECT COUNT(*) as count FROM full_tests');
    if (fullCount[0].count === 0) {
      const fullTests = [
        ['Какое устройство расположено ближе всего к процессору в иерархии памяти?', 'Оперативная память', 'Кэш-память', 'Регистры процессора', 'Жёсткий диск', 'C', 1],
        ['Что измеряется в битах, байтах, КБ, МБ, ГБ?', 'Быстродействие', 'Ёмкость памяти', 'Стоимость', 'Надёжность', 'B', 1],
        ['Какой тип памяти имеет наименьшую ёмкость?', 'HDD', 'Оперативная память', 'Кэш-память', 'Регистры процессора', 'D', 1],
        ['Какое ЗУ является энергонезависимым?', 'RAM', 'Кэш-память', 'SSD', 'Регистры процессора', 'C', 1],
        ['Что такое время доступа к памяти?', 'Объём данных', 'Интервал от запроса до получения данных', 'Частота работы', 'Пропускная способность', 'B', 1],
        ['Какой параметр памяти характеризуется стоимостью за единицу хранения?', 'Быстродействие', 'Ёмкость', 'Стоимость', 'Энергонезависимость', 'C', 1],
        ['DRAM требует периодической...', 'Дефрагментации', 'Регенерации', 'Калибровки', 'Форматировки', 'B', 2],
        ['Какое поколение DDR имеет частоту от 4800 МГц?', 'DDR3', 'DDR4', 'DDR5', 'DDR6', 'C', 2],
        ['Что означает CL16 в характеристиках RAM?', 'Частота 16 МГц', 'Тайминг (задержка) 16 тактов', 'Объём 16 ГБ', 'Напряжение 1.6В', 'B', 2],
        ['Какой объём RAM является типичным для современного ПК?', '256 МБ', '1 ГБ', '8-32 ГБ', '1 ТБ', 'C', 2],
        ['Какая память используется в модулях DIMM?', 'SRAM', 'Flash', 'DRAM', 'ROM', 'C', 2],
        ['Что такое пропускная способность памяти?', 'Объём данных', 'Количество данных, передаваемых за единицу времени', 'Время задержки', 'Частота процессора', 'B', 2],
        ['Какое ПЗУ можно программировать только один раз?', 'ROM', 'PROM', 'EPROM', 'EEPROM', 'B', 3],
        ['Современная замена BIOS — это...', 'POST', 'UEFI', 'SATA', 'NVMe', 'B', 3],
        ['Какой тип Flash обеспечивает быстрое случайное чтение?', 'NOR Flash', 'NAND Flash', 'QLC', 'TLC', 'A', 3],
        ['EEPROM стирается...', 'Ультрафиолетом', 'Электрически', 'Магнитным полем', 'Теплом', 'B', 3],
        ['Что происходит при POST?', 'Загрузка ОС', 'Проверка оборудования при включении', 'Форматирование диска', 'Обновление BIOS', 'B', 3],
        ['Какой тип памяти хранит микрокод процессора?', 'HDD', 'Flash/ROM', 'RAM', 'Кэш', 'B', 3],
        ['Какова типичная скорость вращения HDD?', '1000 об/мин', '3000 об/мин', '7200 об/мин', '100000 об/мин', 'C', 4],
        ['Какое преимущество SSD перед HDD?', 'Большая ёмкость', 'Отсутствие движущихся частей', 'Более низкая цена за ГБ', 'Долговечность записи', 'B', 4],
        ['Какой тип NAND Flash хранит 4 бита на ячейку?', 'SLC', 'MLC', 'TLC', 'QLC', 'D', 4],
        ['Какова ёмкость Blu-ray диска (однослойного)?', '700 МБ', '4.7 ГБ', '25 ГБ', '100 ГБ', 'C', 4],
        ['Какой интерфейс SATA III обеспечивает скорость до...', '1.5 Гбит/с', '3 Гбит/с', '6 Гбит/с', '12 Гбит/с', 'C', 4],
        ['Что является главным недостатком QLC памяти?', 'Высокая цена', 'Низкая скорость записи и малый ресурс', 'Большой размер', 'Совместимость', 'B', 4],
        ['Какое устройство быстрее по времени доступа?', 'HDD', 'SSD (NVMe)', 'DVD', 'USB 2.0 Flash', 'B', null],
        ['Что происходит с данными в RAM при отключении питания?', 'Сохраняются', 'Удаляются', 'Сжимаются', 'Шифруются', 'B', null],
        ['Какой уровень иерархии памяти имеет наибольшую ёмкость?', 'Регистры', 'Кэш', 'RAM', 'Внешняя память', 'D', null],
        ['Какая память называется «буферной» между процессором и RAM?', 'ROM', 'Кэш-память', 'HDD', 'Flash', 'B', null],
        ['Какой формат памяти используется в USB-флешках?', 'SRAM', 'DRAM', 'NAND Flash', 'NOR Flash', 'C', null],
        ['Что такое RAID?', 'Тип процессора', 'Массив независимых дисков', 'Вид оперативной памяти', 'Протокол сети', 'B', null],
      ];
      for (const t of fullTests) {
        await conn.query('INSERT INTO full_tests (question, option_a, option_b, option_c, option_d, correct_answer, topic_id) VALUES (?, ?, ?, ?, ?, ?, ?)', t);
      }
      console.log('Full tests created');
    }

    const groups = ['ИС-101', 'ИС-102', 'ИС-201', 'ИС-202', 'ИС-301'];
    for (const g of groups) {
      await conn.query('INSERT IGNORE INTO `groups` (name) VALUES (?)', [g]);
    }
    console.log('Groups created');

    const [studentsCount] = await conn.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    if (studentsCount[0].count === 0) {
      const studentPass = await bcrypt.hash('student123', saltRounds);
      const students = [
        ['ivanov1', 'Иван', 'Иванов', 'Иванович', 'ИС-101'],
        ['petrov1', 'Пётр', 'Петров', 'Петрович', 'ИС-101'],
        ['sidorov1', 'Сидор', 'Сидоров', 'Сидорович', 'ИС-102'],
        ['kuznetsov1', 'Кузьма', 'Кузнецов', 'Кузьмич', 'ИС-201'],
        ['popov1', 'Поп', 'Попов', 'Попович', 'ИС-201'],
      ];
      for (const s of students) {
        const [grp] = await conn.query('SELECT id FROM `groups` WHERE name = ?', [s[4]]);
        if (grp.length > 0) {
          await conn.query(
            'INSERT INTO users (username, password, role, first_name, last_name, middle_name, group_id) VALUES (?, ?, \'student\', ?, ?, ?, ?)',
            [s[0], studentPass, s[1], s[2], s[3], grp[0].id]
          );
        }
      }
      console.log('Sample students created (password: student123)');
    }

    console.log('Database initialization complete!');
  } catch (err) {
    console.error('Database init error:', err.message);
    console.error('Make sure MySQL is running and credentials in .env are correct');
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

initDatabase();
