// Translations dictionary for Arabic/English
const translations = {
  en: {
    // Navigation
    nav_overview: 'Overview',
    nav_gym: 'Gym',
    nav_habits: 'Habits',
    saving: 'SAVING',
    synced: 'SYNCED',
    logout: 'Logout',
    loading: 'Loading...',
    loading_data: 'Loading your data...',
    loading_habits: 'Loading Smart Habits...',

    // Settings
    settings: 'Settings',
    settings_account: 'Account',
    settings_appearance: 'Appearance',
    settings_navigation: 'Navigation',
    settings_layouts: 'Layouts',
    display_name: 'Display Name',
    your_name: 'Your name',
    profile_photo: 'Profile Photo',
    upload_photo: 'Upload Photo',
    max_size: 'Max 500KB • JPG, PNG',
    paste_url: 'Or paste image URL...',
    save_profile: 'Save Profile',
    theme: 'Theme',
    theme_dark: '🌙 Dark',
    theme_light: '☀️ Light',
    theme_midnight: '🌌 Midnight',
    language: 'Language',
    lang_en: '🇬🇧 English',
    lang_ar: '🇪🇬 العربية',
    select_page: 'Select Page',
    page_home: '🏠 Home',
    page_gym: '🏋️ Gym',
    page_habits: '✅ Habits',
    widgets_on: 'Widgets on',
    add_widget: 'Add a Widget',
    main_locked: 'Main widget (locked)',

    // Gym
    gym_streak: 'Days',
    current_streak: 'Current Discipline Streak',
    longest: 'Longest',
    success_rate: 'Success Rate',
    discipline: 'Discipline',
    target_days: 'Target Days',
    workout_system: 'Workout System',
    export_data: 'Export',
    week: 'Week',
    body_stats: 'Body Stats',
    log_weight_fat: 'Log your weight and body fat for this week',
    weight_kg: 'Weight (kg)',
    body_fat: 'Body Fat (%)',
    change: 'Change',
    sections: 'Sections',
    streak_counter: 'Streak Counter',
    daily_action: 'Daily Action',
    momentum: 'Momentum',
    ai_coach: 'AI Coach',
    pattern_insights: 'Pattern Insights',
    gamification: 'Gamification',

    // Heatmap
    workout_activity: 'Workout Activity',
    total_weeks: 'Total Weeks',
    not_done: 'Not Done',
    completed: 'Completed',
    today: 'Today',
    goal_met: 'Goal Met',

    // Weight Table
    weight_progress: '⚖️ Weight & Body Fat Progress',
    track_composition: 'Track your body composition week by week',
    start: 'Start',
    workouts: 'Workouts',

    // Workout Log
    log_workout: 'Log Workout',
    what_train: 'What did you train today?',
    total_value: 'Total Value (kg)',
    enter_total: 'Enter your total weight lifted or max weight for this session',
    notes: 'Notes (optional)',
    notes_placeholder: 'How was the session? Any PRs?',
    save_workout: 'Save Workout',

    // Workout Progress
    workout_progress: '📊 Workout Progress Dashboard',
    session_comparisons: 'Session Comparisons',
    no_data: 'No workout data yet',
    performance_history: 'Performance History',
    vs_previous: 'vs previous',
    first_session: 'First session!',

    // Habits
    habits_title: 'Smart Habits',
    add_habit: 'Add Habit',
    create_habit: 'Create New Habit',
    habit_name: 'Habit Name',
    habit_desc: 'Description (optional)',
    habit_freq: 'Frequency',
    daily: 'Daily',
    weekly: 'Weekly',
    custom: 'Custom',
    save_habit: 'Save Habit',
    delete_habit: 'Delete Habit',
    best_streak: 'Best Streak',
    current: 'Current',
    completion: 'Completion',
    analytics: 'Analytics',
    total_completions: 'Total Completions',
    overall_rate: 'Overall Completion Rate',

    // Life Overview
    overview_title: 'نظرة عامة',
    overview_desc: 'ملخص شامل لنشاطك اليومي، أهدافك، والإنجازات التي حققتها.',

    // Auth (Login / Signup)
    auth_welcome_back: 'Welcome back! Sign in to continue',
    auth_create_account: 'Create your account',
    auth_name_placeholder: 'Your Name',
    auth_email_placeholder: 'Email Address',
    auth_password_placeholder: 'Password',
    auth_sign_in: 'Sign In',
    auth_sign_up: 'Create Account',
    auth_toggle_to_signup: "Don't have an account? Sign Up",
    auth_toggle_to_login: 'Already have an account? Sign In',
    auth_or_continue_with: 'or continue with',
    auth_google: 'Google',
    auth_error_enter_name: 'Please enter your name',
    auth_error_invalid_credentials: 'Invalid email or password',
    auth_error_email_in_use: 'Email already registered. Try logging in.',
    auth_error_weak_password: 'Password must be at least 6 characters',
    auth_error_invalid_email: 'Invalid email address',
    auth_error_google_failed: 'Google sign-in failed',

    // Home widgets (LifeOverview)
    home_welcome_title: 'Welcome',
    home_welcome_desc: 'Add widgets below to customize your home page',
    home_widgets_label: 'Widgets',
    home_manage: 'Manage',
    home_current_widgets: 'Current Widgets',
    home_add_widget: 'Add Widget',
    home_empty_widgets_hint: 'Click "Manage" to add widgets',

    // Heatmap UX
    heatmap_hint: 'Click any day to mark as done · Completed weeks glow with a 🏆',
    heatmap_status_workout: 'Workout Done ✅',
    heatmap_status_locked_rest: 'Rest (Goal Met) 🏆',
    heatmap_status_auto_rest: 'Rest Day 😴',
    heatmap_status_missed: 'Missed ❌',
    heatmap_status_pending: 'Pending',
    heatmap_legend_break: 'Break',
    heatmap_legend_workout: 'Workout ✅',

    // Habits dashboard
    habits_daily_title: 'Daily Habits',
    habits_daily_desc: 'Build consistency, one action at a time.',
    habits_completed_today: 'Completed Today',
    habits_new_habit: 'New Habit',

    // Habit card (tooltips / labels)
    habit_mark_pending: 'Mark as Pending',
    habit_mark_completed: 'Mark as Completed',
    habit_current_streak: 'Current Streak',
    habit_grace_days_left: 'Grace days left this month',
    habit_energy_low: 'Low Energy',
    habit_energy_medium: 'Medium Energy',
    habit_energy_high: 'High Energy',
    habit_skips_left: 'Skips Left',
    habit_how_did_you_feel: 'How did you feel?',
    habit_mood_bad: 'Bad Mood',
    habit_mood_okay: 'Okay',
    habit_mood_great: 'Great Mood',
    habit_normal: 'Normal',

    // Habits create/edit
    habits_build_new: 'Build a New Habit',
    habits_form_name: 'Habit Name',
    habits_form_save: 'Save Habit',

    // Gym header
    gym_weekly_goal: 'Weekly Goal:',
    gym_export_csv: 'Export CSV',

    // Daily action panel
    daily_action_title: 'Daily Action',
    daily_action_subtitle: "Today's commitment",

    // Unified habits grid / detail
    status_pending: 'Pending',
    status_missed: 'Missed',
    status_future: 'Future',
    status_before_start: 'Before Start',
    click_to_toggle: 'Click to toggle',
    status_grace: 'Grace',
    status_success: 'Success',

    // Daily action CTA
    daily_today_completed: 'Today Completed ✨',
    daily_mark_today_complete: 'Mark Today Complete',
    daily_celebration: 'Amazing! Keep the streak alive!',

    // Create habit form (core)
    habit_icon: 'Icon',
    habit_placeholder_example: 'e.g. Read 20 pages',
    habit_start_date: 'Start Date',
    habit_start_date_hint: 'If you started this habit in the past, set the date here to track your true progress.',
    habit_category: 'Category',
    habit_category_health: 'Health',
    habit_category_fitness: 'Fitness',
    habit_category_productivity: 'Productivity',
    habit_category_learning: 'Learning',
    habit_category_spirituality: 'Spirituality',
    habit_category_islamic: 'Islamic',
    habit_category_social: 'Social',
    habit_category_finance: 'Finance',
    habit_category_mindfulness: 'Mindfulness',
    habit_category_other: 'Other',

    // Settings misc
    settings_image_too_large: 'Image must be smaller than 500KB',
    settings_remove: 'Remove',
    settings_add_pages: 'Add Pages',
    settings_reset_default: 'Reset to Default',

    // Workout table
    missed_breaks_streak: 'Missed (Breaks Streak)',
  },
  ar: {
    // Navigation
    nav_overview: 'نظرة عامة',
    nav_gym: 'الجيم',
    nav_habits: 'العادات',
    saving: 'جاري الحفظ',
    synced: 'تم المزامنة',
    logout: 'تسجيل خروج',
    loading: 'جاري التحميل...',
    loading_data: 'جاري تحميل بياناتك...',
    loading_habits: 'جاري تحميل العادات...',

    // Settings
    settings: 'الإعدادات',
    settings_account: 'الحساب',
    settings_appearance: 'المظهر',
    settings_navigation: 'التنقل',
    settings_layouts: 'التخطيط',
    display_name: 'اسم العرض',
    your_name: 'اسمك',
    profile_photo: 'صورة البروفايل',
    upload_photo: 'رفع صورة',
    max_size: 'الحد الأقصى 500KB • JPG, PNG',
    paste_url: 'أو الصق رابط الصورة...',
    save_profile: 'حفظ البيانات',
    theme: 'المظهر',
    theme_dark: '🌙 داكن',
    theme_light: '☀️ فاتح',
    theme_midnight: '🌌 منتصف الليل',
    language: 'اللغة',
    lang_en: '🇬🇧 English',
    lang_ar: '🇪🇬 العربية',
    select_page: 'اختر الصفحة',
    page_home: '🏠 الرئيسية',
    page_gym: '🏋️ الجيم',
    page_habits: '✅ العادات',
    widgets_on: 'الأقسام في',
    add_widget: 'إضافة قسم',
    main_locked: 'قسم رئيسي (مقفل)',

    // Gym
    gym_streak: 'يوم',
    current_streak: 'سلسلة الانضباط الحالية',
    longest: 'الأطول',
    success_rate: 'نسبة النجاح',
    discipline: 'الانضباط',
    target_days: 'أيام الهدف',
    workout_system: 'نظام التمرين',
    export_data: 'تصدير',
    week: 'أسبوع',
    body_stats: 'قياسات الجسم',
    log_weight_fat: 'سجل وزنك ونسبة الدهون لهذا الأسبوع',
    weight_kg: 'الوزن (كجم)',
    body_fat: 'نسبة الدهون (%)',
    change: 'التغيير',
    sections: 'الأقسام',
    streak_counter: 'عداد السلسلة',
    daily_action: 'الإجراء اليومي',
    momentum: 'الزخم',
    ai_coach: 'المدرب الذكي',
    pattern_insights: 'تحليل الأنماط',
    gamification: 'التحفيز',

    // Heatmap
    workout_activity: 'نشاط التمارين',
    total_weeks: 'إجمالي الأسابيع',
    not_done: 'لم يتم',
    completed: 'مكتمل',
    today: 'اليوم',
    goal_met: 'تم تحقيق الهدف',

    // Weight Table
    weight_progress: '⚖️ تقدم الوزن والدهون',
    track_composition: 'تتبع تكوين جسمك أسبوعياً',
    start: 'البداية',
    workouts: 'التمارين',

    // Workout Log
    log_workout: 'تسجيل تمرين',
    what_train: 'ماذا تدربت اليوم؟',
    total_value: 'القيمة الكلية (كجم)',
    enter_total: 'أدخل إجمالي الأوزان المرفوعة أو الحد الأقصى للجلسة',
    notes: 'ملاحظات (اختياري)',
    notes_placeholder: 'كيف كانت الجلسة؟ أي أرقام قياسية؟',
    save_workout: 'حفظ التمرين',

    // Workout Progress
    workout_progress: '📊 لوحة تقدم التمارين',
    session_comparisons: 'مقارنات الجلسات',
    no_data: 'لا توجد بيانات تمارين بعد',
    performance_history: 'سجل الأداء',
    vs_previous: 'مقارنة بالسابق',
    first_session: 'الجلسة الأولى!',

    // Habits
    habits_title: 'العادات الذكية',
    add_habit: 'إضافة عادة',
    create_habit: 'إنشاء عادة جديدة',
    habit_name: 'اسم العادة',
    habit_desc: 'الوصف (اختياري)',
    habit_freq: 'التكرار',
    daily: 'يومي',
    weekly: 'أسبوعي',
    custom: 'مخصص',
    save_habit: 'حفظ العادة',
    delete_habit: 'حذف العادة',
    best_streak: 'أفضل سلسلة',
    current: 'الحالي',
    completion: 'الإنجاز',
    analytics: 'التحليلات',
    total_completions: 'إجمالي الإنجازات',
    overall_rate: 'نسبة الإنجاز الكلية',

    // Life Overview
    overview_title: 'نظرة عامة',
    overview_desc: 'ملخص شامل لنشاطك اليومي، أهدافك، والإنجازات التي حققتها.',

    // Auth (Login / Signup)
    auth_welcome_back: 'مرحباً بعودتك! سجّل الدخول للمتابعة',
    auth_create_account: 'أنشئ حسابك',
    auth_name_placeholder: 'اسمك',
    auth_email_placeholder: 'البريد الإلكتروني',
    auth_password_placeholder: 'كلمة المرور',
    auth_sign_in: 'تسجيل الدخول',
    auth_sign_up: 'إنشاء حساب',
    auth_toggle_to_signup: 'ليس لديك حساب؟ أنشئ حساباً',
    auth_toggle_to_login: 'لديك حساب بالفعل؟ سجّل الدخول',
    auth_or_continue_with: 'أو أكمل باستخدام',
    auth_google: 'Google',
    auth_error_enter_name: 'من فضلك أدخل اسمك',
    auth_error_invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    auth_error_email_in_use: 'هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.',
    auth_error_weak_password: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    auth_error_invalid_email: 'البريد الإلكتروني غير صالح',
    auth_error_google_failed: 'فشل تسجيل الدخول عبر Google',

    // Home widgets (LifeOverview)
    home_welcome_title: 'مرحباً بك',
    home_welcome_desc: 'أضف الأقسام التي تريدها من الأسفل لتخصيص صفحتك الرئيسية',
    home_widgets_label: 'الأقسام',
    home_manage: 'تعديل',
    home_current_widgets: 'الأقسام الحالية',
    home_add_widget: 'إضافة قسم',
    home_empty_widgets_hint: 'اضغط على "تعديل" لإضافة أقسام',

    // Heatmap UX
    heatmap_hint: 'اضغط على أي يوم لتسجيله · الأسابيع المكتملة يظهر عليها 🏆',
    heatmap_status_workout: 'تم التمرين ✅',
    heatmap_status_locked_rest: 'راحة (الهدف متحقق) 🏆',
    heatmap_status_auto_rest: 'يوم راحة 😴',
    heatmap_status_missed: 'فائت ❌',
    heatmap_status_pending: 'قيد الانتظار',
    heatmap_legend_break: 'راحة',
    heatmap_legend_workout: 'تمرين ✅',

    // Habits dashboard
    habits_daily_title: 'العادات اليومية',
    habits_daily_desc: 'ابنِ الاستمرارية، خطوة بخطوة.',
    habits_completed_today: 'مكتمل اليوم',
    habits_new_habit: 'عادة جديدة',

    // Habit card (tooltips / labels)
    habit_mark_pending: 'تعيين كقيد الانتظار',
    habit_mark_completed: 'تعيين كمكتمل',
    habit_current_streak: 'السلسلة الحالية',
    habit_grace_days_left: 'أيام السماح المتبقية هذا الشهر',
    habit_energy_low: 'طاقة منخفضة',
    habit_energy_medium: 'طاقة متوسطة',
    habit_energy_high: 'طاقة عالية',
    habit_skips_left: 'تخطي متبقي',
    habit_how_did_you_feel: 'كيف كان شعورك؟',
    habit_mood_bad: 'مزاج سيئ',
    habit_mood_okay: 'عادي',
    habit_mood_great: 'ممتاز',
    habit_normal: 'عادي',

    // Habits create/edit
    habits_build_new: 'أنشئ عادة جديدة',
    habits_form_name: 'اسم العادة',
    habits_form_save: 'حفظ العادة',

    // Gym header
    gym_weekly_goal: 'هدف الأسبوع:',
    gym_export_csv: 'تصدير CSV',

    // Daily action panel
    daily_action_title: 'الإجراء اليومي',
    daily_action_subtitle: 'التزام اليوم',

    // Unified habits grid / detail
    status_pending: 'قيد الانتظار',
    status_missed: 'فائت',
    status_future: 'مستقبل',
    status_before_start: 'قبل البداية',
    click_to_toggle: 'اضغط للتغيير',
    status_grace: 'سماح',
    status_success: 'نجاح',

    // Daily action CTA
    daily_today_completed: 'تم إكمال اليوم ✨',
    daily_mark_today_complete: 'إكمال اليوم',
    daily_celebration: 'رائع! حافظ على السلسلة!',

    // Create habit form (core)
    habit_icon: 'الأيقونة',
    habit_placeholder_example: 'مثال: اقرأ 20 صفحة',
    habit_start_date: 'تاريخ البداية',
    habit_start_date_hint: 'إذا بدأت هذه العادة في الماضي، عدّل التاريخ هنا لتتبع تقدمك الحقيقي.',
    habit_category: 'التصنيف',
    habit_category_health: 'الصحة',
    habit_category_fitness: 'اللياقة',
    habit_category_productivity: 'الإنتاجية',
    habit_category_learning: 'التعلم',
    habit_category_spirituality: 'الروحانيات',
    habit_category_islamic: 'إسلامي',
    habit_category_social: 'اجتماعي',
    habit_category_finance: 'الماليات',
    habit_category_mindfulness: 'اليقظة',
    habit_category_other: 'أخرى',

    // Settings misc
    settings_image_too_large: 'الصورة يجب أن تكون أقل من 500KB',
    settings_remove: 'إزالة',
    settings_add_pages: 'إضافة صفحات',
    settings_reset_default: 'إعادة التعيين للافتراضي',

    // Workout table
    missed_breaks_streak: 'فائت (يقطع السلسلة)',
  }
};

export function t(key, lang = 'en') {
  return translations[lang]?.[key] || translations.en?.[key] || key;
}

export default translations;
