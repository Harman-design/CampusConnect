import 'package:flutter/material.dart';
import '../widgets/integration_notice.dart';

class AttendanceScreen extends StatelessWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('My Attendance', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        child: IntegrationNotice(
          title: 'ERP Registry Notice',
          icon: Icons.playlist_add_check_outlined,
          accentColor: const Color(0xFF4F8CFF),
          expectedFeatures: const [
            {
              'name': 'Subject-Wise Attendance Metrics',
              'desc': 'Daily check-in percentages for all registered courses.'
            },
            {
              'name': 'Predictive Attendance Forecasts',
              'desc': 'Simulate required classes to maintain safe percentages.'
            },
            {
              'name': 'Absence & Slack Alerts',
              'desc': 'Instant notifications when thresholds drop below 75%.'
            }
          ],
        ),
      ),
    );
  }
}
