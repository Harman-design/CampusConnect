import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('My Profile', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Container(
            maxWidth: 480,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF1F2937)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Avatar
                Center(
                  child: CircleAvatar(
                    radius: 40,
                    backgroundColor: const Color(0xFF4F8CFF).withOpacity(0.1),
                    child: Text(
                      user?['name'] != null
                          ? user!['name'].split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                          : 'CC',
                      style: const TextStyle(color: Color(0xFF4F8CFF), fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  user?['name'] ?? 'Student Profile',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  user?['email'] ?? 'student@srmist.edu.in',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey, fontSize: 11),
                ),
                const SizedBox(height: 24),
                const Divider(color: Color(0xFF1F2937)),
                const SizedBox(height: 16),
                _buildInfoRow('Register Number', user?['registerNumber'] ?? 'N/A'),
                _buildInfoRow('Department', (user?['department'] ?? 'CSE').toString().toUpperCase()),
                _buildInfoRow('Semester', 'Semester ${user?['semester'] ?? 4}'),
                _buildInfoRow('Role Account', (user?['role'] ?? 'Student').toString().toUpperCase()),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: () async {
                    await auth.logout();
                    if (context.mounted) {
                      Navigator.of(context).pushReplacementNamed('/login');
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.redAccent,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Logout Session', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String val) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.between,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
          Text(val, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
