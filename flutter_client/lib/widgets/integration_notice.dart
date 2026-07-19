import 'package:flutter/material.dart';

class IntegrationNotice extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color accentColor;
  final List<Map<String, String>> expectedFeatures;

  const IntegrationNotice({
    super.key,
    required this.title,
    required this.icon,
    required this.accentColor,
    required this.expectedFeatures,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Center(
      child: Container(
        maxWidth: 500,
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF111827) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? const Color(0xFF1F2937) : Colors.grey.shade200,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Locking icon container
            Container(
              height: 96,
              width: 96,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0B1220) : Colors.grey.shade50,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isDark ? const Color(0xFF1F2937) : Colors.grey.shade100,
                ),
              ),
              child: Center(
                child: Icon(
                  Icons.lock_outline_rounded,
                  size: 40,
                  color: accentColor,
                ),
              ),
            ),
            const SizedBox(height: 24),
            // Header notice badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, py: 4),
              decoration: BoxDecoration(
                color: accentColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: accentColor.withOpacity(0.2)),
              ),
              child: Text(
                title.toUpperCase(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: accentColor,
                  letterSpacing: 1.2,
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Institution Integration Required',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'This feature will become available once academic data is integrated by the college administration.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            const Divider(color: Color(0xFF1F2937)),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Expected Dashboard Features'.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.grey,
                  letterSpacing: 1.2,
                ),
              ),
            ),
            const SizedBox(height: 16),
            ...expectedFeatures.map((feature) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 32,
                        width: 32,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF0B1220) : Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isDark ? const Color(0xFF1F2937) : Colors.grey.shade100,
                          ),
                        ),
                        child: Center(
                          child: Icon(
                            icon,
                            size: 16,
                            color: accentColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              feature['name'] ?? '',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              feature['desc'] ?? '',
                              style: const TextStyle(
                                fontSize: 10,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
