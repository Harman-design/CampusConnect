import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import '../widgets/responsive_layout.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final isMobile = ResponsiveLayout.isMobile(context);

    // Sidebar/Bottom-navigation items definition
    final menuItems = [
      {'title': 'Dashboard', 'icon': Icons.dashboard_outlined, 'route': '/dashboard'},
      {'title': 'Attendance', 'icon': Icons.playlist_add_check_outlined, 'route': '/attendance'},
      {'title': 'Notes', 'icon': Icons.description_outlined, 'route': '/notes'},
      {'title': 'PYQs', 'icon': Icons.assignment_outlined, 'route': '/pyqs'},
      {'title': 'Fees & Payments', 'icon': Icons.payment_outlined, 'route': '/fees'},
      {'title': 'Exam Results', 'icon': Icons.school_outlined, 'route': '/exams'},
      {'title': 'Internal Marks', 'icon': Icons.analytics_outlined, 'route': '/marks'},
      {'title': 'AI Assistant', 'icon': Icons.auto_awesome_outlined, 'route': '/ai-assistant'},
      {'title': 'Placements', 'icon': Icons.work_outline, 'route': '/placements'},
      {'title': 'Events', 'icon': Icons.event_note_outlined, 'route': '/events'},
      {'title': 'Complaints', 'icon': Icons.report_problem_outlined, 'route': '/complaints'},
      {'title': 'Support Tickets', 'icon': Icons.support_agent_outlined, 'route': '/tickets'},
      {'title': 'Profile', 'icon': Icons.person_outline, 'route': '/profile'},
    ];

    // Sidebar Widget for Desktop/Tablet layout
    Widget buildSidebar() {
      return Container(
        width: 250,
        color: const Color(0xFF111827),
        border: const Border(right: BorderSide(color: Color(0xFF1F2937))),
        child: Column(
          children: [
            // Branding header
            Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  Container(
                    height: 32,
                    width: 32,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF4F8CFF), Color(0xFF7C3AED)],
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(
                      child: Text('CC', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'CampusConnect',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                  ),
                ],
              ),
            ),
            const Divider(color: Color(0xFF1F2937)),
            Expanded(
              child: ListView.builder(
                itemCount: menuItems.length,
                itemBuilder: (context, index) {
                  final item = menuItems[index];
                  final isSelected = index == _currentIndex;
                  return ListTile(
                    leading: Icon(
                      item['icon'] as IconData,
                      color: isSelected ? const Color(0xFF4F8CFF) : Colors.grey,
                      size: 20,
                    ),
                    title: Text(
                      item['title'] as String,
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.grey,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        fontSize: 12,
                      ),
                    ),
                    selected: isSelected,
                    selectedTileColor: const Color(0xFF1E293B),
                    onTap: () {
                      setState(() {
                        _currentIndex = index;
                      });
                      Navigator.pushNamed(context, item['route'] as String);
                    },
                  );
                },
              ),
            ),
            // Logout
            const Divider(color: Color(0xFF1F2937)),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.redAccent, size: 20),
              title: const Text('Sign Out', style: TextStyle(color: Colors.redAccent, fontSize: 12)),
              onTap: () async {
                await auth.logout();
                if (mounted) Navigator.pushReplacementNamed(context, '/login');
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      );
    }

    // Main Dashboard Center Deck
    Widget buildDashboardDeck() {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Card
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0B1220)],
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF1F2937)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, py: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF4F8CFF).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFF4F8CFF).withOpacity(0.2)),
                          ),
                          child: const Text(
                            'STUDENT PANEL',
                            style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF4F8CFF)),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Welcome back, ${user?['name']?.split(' ')[0] ?? 'Student'} 👋',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Manage your class schedules, view academic notes, complete fee payments, or run AI exams study guides.',
                          style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.5),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            // Quick metrics grid
            GridView.count(
              crossAxisCount: isMobile ? 2 : 4,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildMetricCard('My Attendance', 'INTEGRATION', 'Req: 75%', Colors.green),
                _buildMetricCard('CGPA', 'INTEGRATION', 'Credits: 72', Colors.deepPurple),
                _buildMetricCard('Pending Fees', 'PENDING', 'Academic/Hostel', Colors.orange),
                _buildMetricCard('Job Applications', '0', 'Active jobs', Colors.blue),
              ],
            ),
            const SizedBox(height: 24),
            // Quick Actions List
            const Text(
              'Quick Modules Navigation',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white),
            ),
            const SizedBox(height: 16),
            ListView(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildQuickAction(context, '📕 Academic Revision Notes & PYQs', 'Access files shared by faculties and Google Drive folders.', '/notes'),
                _buildQuickAction(context, '✨ AI Study Assistant & Quizzes', 'Generate flashcards, quiz practice sheets, or summary guides.', '/ai-assistant'),
                _buildQuickAction(context, '💳 Fee Settlement & Checkout', 'Complete pending academic fee checkouts using Razorpay sandbox.', '/fees'),
              ],
            )
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      appBar: isMobile
          ? AppBar(
              backgroundColor: const Color(0xFF111827),
              elevation: 0,
              iconTheme: const IconThemeData(color: Colors.white),
              title: const Text(
                'CampusConnect',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
            )
          : null,
      drawer: isMobile
          ? Drawer(
              backgroundColor: const Color(0xFF111827),
              child: buildSidebar(),
            )
          : null,
      bottomNavigationBar: isMobile
          ? BottomNavigationBar(
              currentIndex: _currentIndex >= 4 ? 0 : _currentIndex,
              backgroundColor: const Color(0xFF111827),
              selectedItemColor: const Color(0xFF4F8CFF),
              unselectedItemColor: Colors.grey,
              selectedFontSize: 10,
              unselectedFontSize: 10,
              type: BottomNavigationBarType.fixed,
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), label: 'Dashboard'),
                BottomNavigationBarItem(icon: Icon(Icons.description_outlined), label: 'Notes'),
                BottomNavigationBarItem(icon: Icon(Icons.payment_outlined), label: 'Fees'),
                BottomNavigationBarItem(icon: Icon(Icons.auto_awesome_outlined), label: 'AI Study'),
              ],
              onTap: (index) {
                setState(() {
                  _currentIndex = index;
                });
                final routes = ['/dashboard', '/notes', '/fees', '/ai-assistant'];
                Navigator.pushNamed(context, routes[index]);
              },
            )
          : null,
      body: Row(
        children: [
          if (!isMobile) buildSidebar(),
          Expanded(child: buildDashboardDeck()),
        ],
      ),
    );
  }

  Widget _buildMetricCard(String title, String val, String desc, Color accent) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title.toUpperCase(), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.grey)),
          Text(val, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: accent)),
          Text(desc, style: const TextStyle(fontSize: 8, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildQuickAction(BuildContext context, String title, String desc, String route) {
    return Card(
      color: const Color(0xFF111827),
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFF1F2937)),
      ),
      child: ListTile(
        title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(desc, style: const TextStyle(color: Colors.grey, fontSize: 10)),
        ),
        trailing: const Icon(Icons.chevron_right, color: Colors.grey),
        onTap: () => Navigator.pushNamed(context, route),
      ),
    );
  }
}
