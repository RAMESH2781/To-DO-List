// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskPriority = document.getElementById('task-priority');
const taskCategory = document.getElementById('task-category');
const taskDueDate = document.getElementById('task-due-date');
const customCategory = document.getElementById('custom-category');
const editTaskId = document.getElementById('edit-task-id');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const taskList = document.getElementById('task-list');
const progressBar = document.getElementById('task-progress-bar');
const progressPercentage = document.getElementById('progress-percentage');
const motivationalMessage = document.getElementById('motivational-message');
const themeToggle = document.getElementById('theme-toggle');
const filterBtns = document.querySelectorAll('.filter-btn');
const preferenceBtns = document.querySelectorAll('.preference-btn');
const foodSuggestions = document.getElementById('food-suggestions');
const currentMealTime = document.getElementById('current-meal-time');
const suggestionCards = document.getElementById('suggestion-cards');
const foodReminderForm = document.getElementById('food-reminder-form');
const foodReminderInput = document.getElementById('food-reminder-input');
const foodReminderTime = document.getElementById('food-reminder-time');
const foodReminderList = document.getElementById('food-reminder-list');
const exportBtn = document.getElementById('export-btn');
const importInput = document.getElementById('import-input');
const toastContainer = document.getElementById('toast-container');
const notificationContainer = document.getElementById('notification-container');

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let foodReminders = JSON.parse(localStorage.getItem('foodReminders')) || [];
let currentFilter = 'all';
let currentPreference = 'all';

// Initialize the application
function init() {
    renderTasks();
    updateProgressBar();
    checkMotivationalMessage();
    setDefaultDueDate();
    displayFoodSuggestions();
    renderFoodReminders();
    setupEventListeners();
    
    // Check for dark mode preference in local storage
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Setup notifications for upcoming tasks
    checkTaskNotifications();
}

// Set up all event listeners
function setupEventListeners() {
    // Task form submission
    taskForm.addEventListener('submit', handleTaskFormSubmit);
    
    // Category change event
    taskCategory.addEventListener('change', () => {
        if (taskCategory.value === 'Custom') {
            customCategory.classList.remove('hidden');
        } else {
            customCategory.classList.add('hidden');
        }
    });
    
    // Cancel edit button
    cancelEditBtn.addEventListener('click', cancelEdit);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderTasks();
        });
    });
    
    // Food preference buttons
    preferenceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            preferenceBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPreference = btn.getAttribute('data-preference');
            displayFoodSuggestions();
        });
    });
    
    // Food reminder form
    foodReminderForm.addEventListener('submit', handleFoodReminderSubmit);
    
    // Export button
    exportBtn.addEventListener('click', exportTasks);
    
    // Import input
    importInput.addEventListener('change', importTasks);
}

// Handle task form submission (add or edit task)
function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const taskText = taskInput.value.trim();
    const priority = taskPriority.value;
    const category = taskCategory.value === 'Custom' ? customCategory.value.trim() || 'Custom' : taskCategory.value;
    const dueDate = taskDueDate.value ? new Date(taskDueDate.value).toISOString() : '';
    
    if (!taskText) return;
    
    if (editTaskId.value) {
        // Edit existing task
        const index = tasks.findIndex(task => task.id === editTaskId.value);
        if (index !== -1) {
            tasks[index] = {
                ...tasks[index],
                text: taskText,
                priority,
                category,
                dueDate,
                lastUpdated: new Date().toISOString()
            };
            showToast('Task updated successfully!', 'success');
        }
        
        // Reset form
        cancelEdit();
    } else {
        // Add new task
        const newTask = {
            id: Date.now().toString(),
            text: taskText,
            completed: false,
            priority,
            category,
            dueDate,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        tasks.push(newTask);
        showToast('Task added successfully!', 'success');
        
        // Reset form
        taskForm.reset();
        customCategory.classList.add('hidden');
    }
    
    // Save tasks and update UI
    saveTasks();
    renderTasks();
    updateProgressBar();
    checkMotivationalMessage();
    checkTaskNotifications();
}

// Render all tasks based on current filter
function renderTasks() {
    taskList.innerHTML = '';
    
    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });
    
    if (filteredTasks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-state';
        emptyMessage.textContent = 'No tasks found. Add a new task to get started!';
        taskList.appendChild(emptyMessage);
        return;
    }
    
    filteredTasks.forEach((task, index) => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;
        
        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
        
        // Create task content
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        // Task name
        const taskName = document.createElement('div');
        taskName.className = 'task-name';
        taskName.textContent = task.text;
        
        // Task metadata
        const taskMeta = document.createElement('div');
        taskMeta.className = 'task-meta';
        
        // Task category
        const taskCategory = document.createElement('span');
        taskCategory.className = 'task-category';
        taskCategory.innerHTML = `<i class="fas fa-tag"></i> ${task.category}`;
        
        // Task due date
        let taskDue = '';
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            taskDue = `<i class="fas fa-calendar"></i> ${formatDate(dueDate)}`;
        }
        
        // Task priority indicator
        const priorityIndicator = document.createElement('span');
        priorityIndicator.className = `task-priority-indicator priority-${task.priority}`;
        taskName.prepend(priorityIndicator);
        
        // Add task due date if exists
        if (taskDue) {
            const dueDateElement = document.createElement('span');
            dueDateElement.className = 'task-due-date';
            dueDateElement.innerHTML = taskDue;
            taskMeta.appendChild(dueDateElement);
        }
        
        taskMeta.prepend(taskCategory);
        taskContent.appendChild(taskName);
        taskContent.appendChild(taskMeta);
        
        // Task actions (edit and delete)
        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'task-edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Edit task';
        editBtn.addEventListener('click', () => editTask(task.id));
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.title = 'Delete task';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        taskActions.appendChild(editBtn);
        taskActions.appendChild(deleteBtn);
        
        // Assemble task item
        taskItem.appendChild(checkbox);
        taskItem.appendChild(taskContent);
        taskItem.appendChild(taskActions);
        
        taskList.appendChild(taskItem);
    });
}

// Toggle task completion status
function toggleTaskCompletion(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].lastUpdated = new Date().toISOString();
        
        saveTasks();
        renderTasks();
        updateProgressBar();
        checkMotivationalMessage();
        
        if (tasks[taskIndex].completed) {
            showToast('Task completed! Good job!', 'success');
        }
    }
}

// Edit a task
function editTask(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;
    
    // Fill form with task data
    taskInput.value = task.text;
    taskPriority.value = task.priority;
    taskCategory.value = ['Work', 'Personal', 'Health'].includes(task.category) ? task.category : 'Custom';
    
    if (taskCategory.value === 'Custom') {
        customCategory.classList.remove('hidden');
        customCategory.value = task.category;
    }
    
    if (task.dueDate) {
        const localDateTime = new Date(task.dueDate).toISOString().slice(0, 16);
        taskDueDate.value = localDateTime;
    } else {
        taskDueDate.value = '';
    }
    
    editTaskId.value = taskId;
    cancelEditBtn.classList.remove('hidden');
    
    // Scroll to form and focus on input
    taskForm.scrollIntoView({ behavior: 'smooth' });
    taskInput.focus();
}

// Cancel editing task
function cancelEdit() {
    taskForm.reset();
    editTaskId.value = '';
    cancelEditBtn.classList.add('hidden');
    customCategory.classList.add('hidden');
    setDefaultDueDate();
}

// Delete a task
function deleteTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        const taskName = tasks[taskIndex].text;
        tasks.splice(taskIndex, 1);
        
        saveTasks();
        renderTasks();
        updateProgressBar();
        checkMotivationalMessage();
        
        showToast(`Task "${taskName}" deleted!`, 'info');
    }
}

// Update progress bar based on task completion
function updateProgressBar() {
    if (tasks.length === 0) {
        progressBar.style.width = '0%';
        progressPercentage.textContent = '0%';
        return;
    }
    
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    const percentComplete = Math.round((completedTasks / totalTasks) * 100);
    
    progressBar.style.width = `${percentComplete}%`;
    progressPercentage.textContent = `${percentComplete}%`;
}

// Check if motivational message should be shown
function checkMotivationalMessage() {
    const completedTasks = tasks.filter(task => task.completed).length;
    
    // Show motivational message if 3 or more tasks are completed
    if (completedTasks >= 3) {
        const messages = [
            "You're doing great! Keep up the good work!",
            "Fantastic progress! You're on a roll!",
            "Amazing job completing those tasks!",
            "Keep going! You're making excellent progress!",
            "Productivity champion! Well done!"
        ];
        
        motivationalMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
        motivationalMessage.classList.add('show');
    } else {
        motivationalMessage.classList.remove('show');
    }
}

// Set default due date for new tasks (tomorrow)
function setDefaultDueDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    
    const localDateTime = tomorrow.toISOString().slice(0, 16);
    taskDueDate.value = localDateTime;
}

// Toggle between dark and light theme
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    
    const isDarkMode = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkMode', isDarkMode);
    
    if (isDarkMode) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    showToast(`${isDarkMode ? 'Dark' : 'Light'} mode activated`, 'info');
}

// Display food suggestions based on time of day and preference
function displayFoodSuggestions() {
    // Determine current meal time based on current hour
    const currentHour = new Date().getHours();
    let mealTime;
    
    if (currentHour >= 5 && currentHour < 11) {
        mealTime = 'Breakfast';
    } else if (currentHour >= 11 && currentHour < 15) {
        mealTime = 'Lunch';
    } else if (currentHour >= 15 && currentHour < 19) {
        mealTime = 'Evening Snack';
    } else {
        mealTime = 'Dinner';
    }
    
    currentMealTime.textContent = `Current Meal: ${mealTime}`;
    
    // Define food suggestions for each meal and preference
    const foodSuggestionsByMeal = {
        'Breakfast': {
            'all': [
                { name: 'Oatmeal', type: 'veg', properties: ['Protein', 'Fiber', 'Budget'] },
                { name: 'Eggs & Toast', type: 'non-veg', properties: ['Protein', 'Quick'] },
                { name: 'Fruit Smoothie', type: 'veg', properties: ['Vitamins', 'Hydrating'] },
                { name: 'Yogurt Parfait', type: 'veg', properties: ['Protein', 'Calcium'] }
            ],
            'veg': [
                { name: 'Oatmeal', type: 'veg', properties: ['Protein', 'Fiber', 'Budget'] },
                { name: 'Fruit Smoothie', type: 'veg', properties: ['Vitamins', 'Hydrating'] },
                { name: 'Yogurt Parfait', type: 'veg', properties: ['Protein', 'Calcium'] },
                { name: 'Avocado Toast', type: 'veg', properties: ['Healthy Fats', 'Fiber'] }
            ],
            'non-veg': [
                { name: 'Eggs & Toast', type: 'non-veg', properties: ['Protein', 'Quick'] },
                { name: 'Bacon & Eggs', type: 'non-veg', properties: ['Protein', 'Energy'] },
                { name: 'Ham Sandwich', type: 'non-veg', properties: ['Protein', 'Quick'] },
                { name: 'Chicken Wrap', type: 'non-veg', properties: ['Protein', 'Portable'] }
            ],
            'hostel': [
                { name: 'Instant Oatmeal', type: 'veg', properties: ['No-Cook', 'Budget'] },
                { name: 'Peanut Butter Sandwich', type: 'veg', properties: ['No-Cook', 'Protein'] },
                { name: 'Cereal & Milk', type: 'veg', properties: ['No-Cook', 'Quick'] },
                { name: 'Banana & Protein Bar', type: 'veg', properties: ['No-Cook', 'Portable'] }
            ]
        },
        'Lunch': {
            'all': [
                { name: 'Chicken Salad', type: 'non-veg', properties: ['Protein', 'Healthy'] },
                { name: 'Vegetable Wrap', type: 'veg', properties: ['Fiber', 'Portable'] },
                { name: 'Tuna Sandwich', type: 'non-veg', properties: ['Protein', 'Omega-3'] },
                { name: 'Bean Burrito', type: 'veg', properties: ['Protein', 'Fiber'] }
            ],
            'veg': [
                { name: 'Vegetable Wrap', type: 'veg', properties: ['Fiber', 'Portable'] },
                { name: 'Bean Burrito', type: 'veg', properties: ['Protein', 'Fiber'] },
                { name: 'Hummus Salad', type: 'veg', properties: ['Protein', 'Healthy'] },
                { name: 'Veggie Burger', type: 'veg', properties: ['Protein', 'Satisfying'] }
            ],
            'non-veg': [
                { name: 'Chicken Salad', type: 'non-veg', properties: ['Protein', 'Healthy'] },
                { name: 'Tuna Sandwich', type: 'non-veg', properties: ['Protein', 'Omega-3'] },
                { name: 'Turkey Wrap', type: 'non-veg', properties: ['Protein', 'Portable'] },
                { name: 'Beef Burrito', type: 'non-veg', properties: ['Protein', 'Energy'] }
            ],
            'hostel': [
                { name: 'Cup Noodles', type: 'veg', properties: ['Quick', 'Budget'] },
                { name: 'Canned Soup', type: 'veg', properties: ['Easy', 'Shelf-stable'] },
                { name: 'Cheese Sandwich', type: 'veg', properties: ['No-Cook', 'Quick'] },
                { name: 'Peanut Butter & Jelly', type: 'veg', properties: ['No-Cook', 'Energy'] }
            ]
        },
        'Evening Snack': {
            'all': [
                { name: 'Trail Mix', type: 'veg', properties: ['Energy', 'Portable'] },
                { name: 'Greek Yogurt', type: 'veg', properties: ['Protein', 'Calcium'] },
                { name: 'Jerky', type: 'non-veg', properties: ['Protein', 'Shelf-stable'] },
                { name: 'Apple & Cheese', type: 'veg', properties: ['Fiber', 'Calcium'] }
            ],
            'veg': [
                { name: 'Trail Mix', type: 'veg', properties: ['Energy', 'Portable'] },
                { name: 'Greek Yogurt', type: 'veg', properties: ['Protein', 'Calcium'] },
                { name: 'Apple & Cheese', type: 'veg', properties: ['Fiber', 'Calcium'] },
                { name: 'Hummus & Veggies', type: 'veg', properties: ['Protein', 'Fiber'] }
            ],
            'non-veg': [
                { name: 'Jerky', type: 'non-veg', properties: ['Protein', 'Shelf-stable'] },
                { name: 'Hard-boiled Eggs', type: 'non-veg', properties: ['Protein', 'Portable'] },
                { name: 'Tuna & Crackers', type: 'non-veg', properties: ['Protein', 'Quick'] },
                { name: 'Chicken Wrap', type: 'non-veg', properties: ['Protein', 'Satisfying'] }
            ],
            'hostel': [
                { name: 'Protein Bar', type: 'veg', properties: ['No-Cook', 'Portable'] },
                { name: 'Dried Fruits', type: 'veg', properties: ['No-Cook', 'Energy'] },
                { name: 'Crackers & Jam', type: 'veg', properties: ['No-Cook', 'Budget'] },
                { name: 'Cereal Bar', type: 'veg', properties: ['No-Cook', 'Quick'] }
            ]
        },
        'Dinner': {
            'all': [
                { name: 'Pasta with Sauce', type: 'veg', properties: ['Carbs', 'Satisfying'] },
                { name: 'Grilled Chicken', type: 'non-veg', properties: ['Protein', 'Healthy'] },
                { name: 'Bean Chili', type: 'veg', properties: ['Protein', 'Fiber'] },
                { name: 'Stir Fry', type: 'non-veg', properties: ['Balanced', 'Vegetables'] }
            ],
            'veg': [
                { name: 'Pasta with Sauce', type: 'veg', properties: ['Carbs', 'Satisfying'] },
                { name: 'Bean Chili', type: 'veg', properties: ['Protein', 'Fiber'] },
                { name: 'Vegetable Curry', type: 'veg', properties: ['Spicy', 'Vitamins'] },
                { name: 'Tofu Stir Fry', type: 'veg', properties: ['Protein', 'Vegetables'] }
            ],
            'non-veg': [
                { name: 'Grilled Chicken', type: 'non-veg', properties: ['Protein', 'Healthy'] },
                { name: 'Stir Fry', type: 'non-veg', properties: ['Balanced', 'Vegetables'] },
                { name: 'Fish & Rice', type: 'non-veg', properties: ['Omega-3', 'Protein'] },
                { name: 'Meatballs & Pasta', type: 'non-veg', properties: ['Protein', 'Satisfying'] }
            ],
            'hostel': [
                { name: 'Microwave Dinner', type: 'veg', properties: ['Quick', 'No-Prep'] },
                { name: 'Ramen with Egg', type: 'non-veg', properties: ['Budget', 'Quick'] },
                { name: 'Canned Chili', type: 'veg', properties: ['No-Cook', 'Shelf-stable'] },
                { name: 'Microwaved Potato', type: 'veg', properties: ['Easy', 'Budget'] }
            ]
        }
    };
    
    // Get suggestions for current meal and preference
    let suggestions = [];
    
    if (currentPreference === 'all') {
        suggestions = foodSuggestionsByMeal[mealTime]['all'];
    } else {
        suggestions = foodSuggestionsByMeal[mealTime][currentPreference];
    }
    
    // Render food suggestion cards
    suggestionCards.innerHTML = '';
    
    suggestions.forEach(food => {
        const foodCard = document.createElement('div');
        foodCard.className = 'food-card';
        
        const foodType = document.createElement('div');
        foodType.className = 'food-type';
        foodType.textContent = food.type === 'veg' ? 'Vegetarian' : (food.type === 'non-veg' ? 'Non-Vegetarian' : food.type);
        
        const foodName = document.createElement('div');
        foodName.className = 'food-name';
        foodName.textContent = food.name;
        
        const foodProperties = document.createElement('div');
        foodProperties.className = 'food-properties';
        
        food.properties.forEach(prop => {
            const property = document.createElement('span');
            property.className = 'food-property';
            property.textContent = prop;
            foodProperties.appendChild(property);
        });
        
        foodCard.appendChild(foodType);
        foodCard.appendChild(foodName);
        foodCard.appendChild(foodProperties);
        
        suggestionCards.appendChild(foodCard);
    });
}

// Handle food reminder submission
function handleFoodReminderSubmit(e) {
    e.preventDefault();
    
    const reminderText = foodReminderInput.value.trim();
    const reminderTime = foodReminderTime.value;
    
    if (!reminderText || !reminderTime) return;
    
    const newReminder = {
        id: Date.now().toString(),
        text: reminderText,
        time: reminderTime,
        createdAt: new Date().toISOString()
    };
    
    foodReminders.push(newReminder);
    saveFoodReminders();
    renderFoodReminders();
    
    // Reset form
    foodReminderForm.reset();
    
    showToast('Food reminder added!', 'success');
    
    // Set up a reminder notification
    setupFoodReminder(newReminder);
}

// Render food reminders
function renderFoodReminders() {
    foodReminderList.innerHTML = '';
    
    if (foodReminders.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-state';
        emptyMessage.textContent = 'No food reminders added yet.';
        foodReminderList.appendChild(emptyMessage);
        return;
    }
    
    // Sort reminders by time
    foodReminders.sort((a, b) => {
        return a.time.localeCompare(b.time);
    });
    
    foodReminders.forEach(reminder => {
        const reminderItem = document.createElement('li');
        reminderItem.className = 'reminder-item';
        reminderItem.dataset.id = reminder.id;
        
        const reminderText = document.createElement('div');
        reminderText.className = 'reminder-text';
        reminderText.textContent = reminder.text;
        
        const reminderTime = document.createElement('div');
        reminderTime.className = 'reminder-time';
        reminderTime.textContent = formatTime(reminder.time);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'reminder-delete';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.addEventListener('click', () => deleteFoodReminder(reminder.id));
        
        reminderItem.appendChild(reminderText);
        reminderItem.appendChild(reminderTime);
        reminderItem.appendChild(deleteBtn);
        
        foodReminderList.appendChild(reminderItem);
        
        // Set up the reminder notification
        setupFoodReminder(reminder);
    });
}

// Delete a food reminder
function deleteFoodReminder(reminderId) {
    const reminderIndex = foodReminders.findIndex(reminder => reminder.id === reminderId);
    if (reminderIndex !== -1) {
        foodReminders.splice(reminderIndex, 1);
        saveFoodReminders();
        renderFoodReminders();
        
        showToast('Food reminder deleted!', 'info');
    }
}

// Set up a reminder notification for food
function setupFoodReminder(reminder) {
    // Check if this is a future time today
    const [hours, minutes] = reminder.time.split(':');
    
    const reminderDate = new Date();
    reminderDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    // If the time has already passed today, don't set a reminder
    if (reminderDate < new Date()) return;
    
    const timeUntilReminder = reminderDate - new Date();
    
    setTimeout(() => {
        showNotification(`Food Reminder: ${reminder.text}`, 'It\'s time to eat!');
    }, timeUntilReminder);
}

// Check for upcoming task notifications
function checkTaskNotifications() {
    tasks.forEach(task => {
        if (!task.completed && task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const now = new Date();
            
            // Calculate time difference in minutes
            const timeDiff = (dueDate - now) / (1000 * 60);
            
            // If due within 30 minutes
            if (timeDiff > 0 && timeDiff <= 30) {
                setTimeout(() => {
                    if (!tasks.find(t => t.id === task.id)?.completed) {
                        showNotification(`Task Due Soon: ${task.text}`, 'This task is due in less than 30 minutes!');
                    }
                }, 1000); // Show after 1 second to avoid immediate popup
            }
        }
    });
}

// Export tasks to JSON file
function exportTasks() {
    const exportData = {
        tasks: tasks,
        foodReminders: foodReminders
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileName = `todo-list-export-${formatDateForFileName(new Date())}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    showToast('Tasks and reminders exported successfully!', 'success');
}

// Import tasks from JSON file
function importTasks(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            
            if (importedData.tasks && Array.isArray(importedData.tasks)) {
                tasks = importedData.tasks;
                saveTasks();
                renderTasks();
                updateProgressBar();
                checkMotivationalMessage();
            }
            
            if (importedData.foodReminders && Array.isArray(importedData.foodReminders)) {
                foodReminders = importedData.foodReminders;
                saveFoodReminders();
                renderFoodReminders();
            }
            
            showToast('Tasks and reminders imported successfully!', 'success');
        } catch (error) {
            showToast('Error importing file. Please check the format.', 'error');
        }
    };
    
    reader.readAsText(file);
    
    // Reset import input
    e.target.value = '';
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 3.3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3300);
}

// Show notification
function showNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    notification.innerHTML = `
        <div>
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
        <button class="close-btn"><i class="fas fa-times"></i></button>
    `;
    
    // Add event listener to close button
    notification.querySelector('.close-btn').addEventListener('click', () => {
        notification.remove();
    });
    
    notificationContainer.appendChild(notification);
    
    // Play notification sound if supported
    try {
        const notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLXPM+N2TQwghWLP0/bxtIwEHOp3s/tXDj1MEBxKArPL/8c2rfFMTLQFqj9z/68qaYSwBIWWj6v/tspZQFwIxc7Dq/96RdD8fCkt9rePo0qJzUDPEzPzZpIJfTJDh//bNmiwaAByN3//wuYIYABF/0//82aqGSE12nP//5cF6GgAQT47U/47pfwD9vsn/zeee/wD+0tP/vu+R/wD7+fv95vLm+gD//wYBDQLu9f/8CwgB9fnv9RAQBP32yfLhDBIFDv8V/+fi8gQNDP/z7/AIABMG+PseGAv34ssLIyT/5MjBCzEu/7uxlxdJQ/+cj3cfs7H/gWlPM93S/3FOQVL/9P+YTVFJ//SbaXi7/v+rfXPS/P/NpZ02tf//5MOdUf///8uxkf////PTwf///+/cz12n//+Cdrj///////////////////////WsXf8A');
        notificationSound.play();
    } catch (e) {
        // Sound not supported, ignore
    }
    
    // Auto-remove notification after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
}

// Helper functions for formatting
function formatDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.getTime() === today.getTime()) {
        return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
    } else {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    }
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
}

function formatDateForFileName(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Save tasks to local storage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Save food reminders to local storage
function saveFoodReminders() {
    localStorage.setItem('foodReminders', JSON.stringify(foodReminders));
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

// Add periodic checks for notifications and food suggestions
setInterval(() => {
    displayFoodSuggestions();
    checkTaskNotifications();
}, 60000); // Check every minute