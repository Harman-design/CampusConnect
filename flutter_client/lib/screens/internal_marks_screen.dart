import 'package:flutter/material.dart';
import '../widgets/integration_notice.dart';

class InternalMarksScreen extends StatelessWidget {
  const InternalMarksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('Internal Marks', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        child: IntegrationNotice(
          title: 'Internal Grades Notice',
          icon: Icons.analytics_outlined,
          accentColor: const Color(0xFFF59E0B),
          expectedFeatures: const [
            {
              'name': 'Continuous Assessment Tests (CAT)',
              'desc': 'Scores for CAT 1, CAT 2, and Model theory/practical examinations.'
            },
            {
              'name': 'Internal Mark Sheets (Out of 40)',
              'desc': 'Consolidated grades for assignments, quizzes, and class seminars.'
            },
            {
              'name': 'Class Average & Bell-Curve Analysis',
              'desc': 'Inspect marks distributions compared to class aggregates.'
            }
          ],
        ),
      ),
    );
  }
}
