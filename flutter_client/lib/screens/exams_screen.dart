import 'package:flutter/material.dart';
import '../widgets/integration_notice.dart';

class ExamsScreen extends StatelessWidget {
  const ExamsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('Exam Results', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        child: IntegrationNotice(
          title: 'Exam Controller Notice',
          icon: Icons.school_outlined,
          accentColor: const Color(0xFF7C3AED),
          expectedFeatures: const [
            {
              'name': 'Official Semester Grade Cards',
              'desc': 'Download verified PDF transcripts and mark sheets directly.'
            },
            {
              'name': 'GPA & CGPA Official Audit',
              'desc': 'Consolidated academic indexes verified by the SRM Exam Controller.'
            },
            {
              'name': 'Hall Tickets & Seating Registry',
              'desc': 'Check schedules, venues, seating coordinates, and eligibility status.'
            }
          ],
        ),
      ),
    );
  }
}
