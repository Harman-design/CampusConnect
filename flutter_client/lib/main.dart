import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'services/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/notes_screen.dart';
import 'screens/pyq_screen.dart';
import 'screens/ai_assistant_screen.dart';
import 'screens/fees_screen.dart';
import 'screens/exams_screen.dart';
import 'screens/internal_marks_screen.dart';
import 'screens/attendance_screen.dart';
import 'screens/placements_screen.dart';
import 'screens/events_screen.dart';
import 'screens/complaints_screen.dart';
import 'screens/support_tickets_screen.dart';
import 'screens/profile_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CampusConnectApp());
}

class CampusConnectApp extends StatelessWidget {
  const CampusConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp(
            title: 'CampusConnect',
            debugShowCheckedModeBanner: false,
            themeMode: ThemeMode.dark,
            darkTheme: ThemeData(
              useMaterial3: true,
              brightness: Brightness.dark,
              scaffoldBackgroundColor: const Color(0xFF0B1220),
              textTheme: GoogleFonts.outfitTextTheme(
                ThemeData.dark().textTheme,
              ),
              colorScheme: const ColorScheme.dark(
                primary: Color(0xFF4F8CFF),
                secondary: Color(0xFF7C3AED),
                surface: Color(0xFF111827),
                background: Color(0xFF0B1220),
              ),
            ),
            initialRoute: auth.isAuthenticated ? '/dashboard' : '/login',
            routes: {
              '/login': (context) => const LoginScreen(),
              '/register': (context) => const RegisterScreen(),
              '/dashboard': (context) => const DashboardScreen(),
              '/notes': (context) => const NotesScreen(),
              '/pyqs': (context) => const PyqScreen(),
              '/ai-assistant': (context) => const AiAssistantScreen(),
              '/fees': (context) => const FeesScreen(),
              '/exams': (context) => const ExamsScreen(),
              '/marks': (context) => const InternalMarksScreen(),
              '/attendance': (context) => const AttendanceScreen(),
              '/placements': (context) => const PlacementsScreen(),
              '/events': (context) => const EventsScreen(),
              '/complaints': (context) => const ComplaintsScreen(),
              '/tickets': (context) => const SupportTicketsScreen(),
              '/profile': (context) => const ProfileScreen(),
            },
          );
        },
      ),
    );
  }
}
