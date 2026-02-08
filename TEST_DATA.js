// Этот файл - тестовые данные для локального тестирования
// Запусти это в консоли браузера чтобы создать тестовых пользователей

// Test User 1: Alice
const alice = {
  id: '1001',
  email: 'alice@example.com',
  password: '123456',
  username: 'alice',
  avatar: null,
  avatarColor: '#667eea',
  bio: 'Бросаю курить вместе с вами!',
  createdAt: new Date().toISOString()
};

// Test User 2: Bob
const bob = {
  id: '1002',
  email: 'bob@example.com',
  password: '123456',
  username: 'bob',
  avatar: null,
  avatarColor: '#f093fb',
  bio: 'Хочу бросить курить',
  createdAt: new Date().toISOString()
};

// Test User 3: Charlie
const charlie = {
  id: '1003',
  email: 'charlie@example.com',
  password: '123456',
  username: 'charlie',
  avatar: null,
  avatarColor: '#4facfe',
  bio: 'День 7 без сигарет!',
  createdAt: new Date().toISOString()
};

// Функция для добавления тестовых пользователей
window.addTestUsers = () => {
  const users = [alice, bob, charlie];
  
  // Сохраняем в qs_users
  localStorage.setItem('qs_users', JSON.stringify(users));
  
  // Сохраняем каждого в qs_user_*
  users.forEach(u => {
    localStorage.setItem(`qs_user_${u.id}`, JSON.stringify(u));
  });
  
  console.log('✓ Добавлены 3 тестовых пользователя:');
  console.log('  1. alice@example.com');
  console.log('  2. bob@example.com');
  console.log('  3. charlie@example.com');
  console.log('Пароль для всех: 123456');
};

// Функция для отладки
window.debugStorage = () => {
  console.log('=== localStorage DEBUG ===');
  console.log('qs_users:', JSON.parse(localStorage.getItem('qs_users') || '[]'));
  console.log('qs_user_*:', Object.keys(localStorage)
    .filter(k => k.startsWith('qs_user_'))
    .map(k => [k, JSON.parse(localStorage.getItem(k))]));
  console.log('Current user:', JSON.parse(localStorage.getItem('qs_user') || 'null'));
};

console.log(`
🧪 TEST UTILITIES LOADED
─────────────────────────
Run these commands:

1. Add test users:
   window.addTestUsers()

2. See storage debug:
   window.debugStorage()

3. Clear everything:
   localStorage.clear()
`);
