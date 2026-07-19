import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:url_launcher/url_launcher.dart';

class FeesScreen extends StatefulWidget {
  const FeesScreen({super.key});

  @override
  State<FeesScreen> createState() => _FeesScreenState();
}

class _FeesScreenState extends State<FeesScreen> {
  Map<String, dynamic>? _feeData;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchFees();
  }

  Future<void> _fetchFees() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.get('/fees/student');
      final data = jsonDecode(res.body);

      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _feeData = data['data'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = data['message'] ?? 'Failed to load fee particulars';
          _isLoading = false;
        });
      }
    } catch (_) {
      setState(() {
        _errorMessage = 'Server connection failed';
        _isLoading = false;
      });
    }
  }

  void _downloadReceipt(String? receiptUrl) async {
    if (receiptUrl == null || receiptUrl.isEmpty) return;
    // Replace api prefix to include full host if needed
    final hostUrl = receiptUrl.startsWith('http') ? receiptUrl : '${ApiService.baseUrl}$receiptUrl';
    final url = Uri.parse(hostUrl);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open receipt link.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final feeDetails = _feeData?['feeDetails'] as List<dynamic>? ?? [];
    final totalOutstanding = _feeData?['totalOutstanding'] as int? ?? 0;
    final paymentHistory = _feeData?['paymentHistory'] as List<dynamic>? ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('Fee Management', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
                ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
                : ListView(
                    children: [
                      // Institutional Warning Banner
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.deepPurple.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.deepPurple.withOpacity(0.15)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline_rounded, color: Colors.deepPurpleAccent),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: const [
                                  Text(
                                    'Institution Integration Required',
                                    style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    'This feature will become available once academic data is integrated by the college administration. Below is the sandbox simulated checkout environment.',
                                    style: TextStyle(color: Colors.grey, fontSize: 9, height: 1.4),
                                  ),
                                ],
                              ),
                            )
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Total Outstanding balance Card
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.red.withOpacity(0.15)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Total Outstanding Due', style: TextStyle(color: Colors.grey, fontSize: 10)),
                                const SizedBox(height: 8),
                                Text('INR ${totalOutstanding.toLocaleString()}', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 28),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text('Fee Details Category Breakdown', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      // Dynamic cards
                      ...feeDetails.map((fee) => Card(
                            color: const Color(0xFF111827),
                            margin: const EdgeInsets.only(bottom: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: const BorderSide(color: Color(0xFF1F2937)),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.between,
                                    children: [
                                      Text('${fee['feeType']} Fees', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                      Text(
                                        fee['status'].toString().toUpperCase(),
                                        style: TextStyle(
                                          color: fee['status'] == 'Paid' ? Colors.green : Colors.orange,
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      )
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.between,
                                    children: [
                                      const Text('Scheduled Amount:', style: TextStyle(color: Colors.grey, fontSize: 10)),
                                      Text('INR ${fee['amount']}', style: const TextStyle(color: Colors.white, fontSize: 10)),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.between,
                                    children: [
                                      const Text('Late Fine Accumulation:', style: TextStyle(color: Colors.grey, fontSize: 10)),
                                      Text('INR ${fee['lateFine']}', style: const TextStyle(color: Colors.white, fontSize: 10)),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.between,
                                    children: [
                                      const Text('Total Paid Balance:', style: TextStyle(color: Colors.grey, fontSize: 10)),
                                      Text('INR ${fee['paidAmount']}', style: const TextStyle(color: Colors.green, fontSize: 10)),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  if (fee['status'] != 'Paid')
                                    SizedBox(
                                      width: double.infinity,
                                      child: ElevatedButton(
                                        onPressed: () {},
                                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F8CFF)),
                                        child: const Text('Simulate Checkout'),
                                      ),
                                    )
                                ],
                              ),
                            ),
                          )),
                      const SizedBox(height: 24),
                      const Text('Recent Settlements History', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      // Payments history
                      ...paymentHistory.map((pay) => ListTile(
                            leading: const Icon(Icons.receipt_long, color: Colors.grey),
                            title: Text('${pay['feeType']} Settlement', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            subtitle: Text('Status: ${pay['status']} • Method: ${pay['method']}', style: const TextStyle(color: Colors.grey, fontSize: 10)),
                            trailing: IconButton(
                              icon: const Icon(Icons.download, color: Color(0xFF4F8CFF)),
                              onPressed: () => _downloadReceipt(pay['receiptUrl']),
                            ),
                          )),
                    ],
                  ),
      ),
    );
  }
}

// Utility extension for formatting numbers
extension IntFormatting on int {
  String toLocaleString() {
    return toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
  }
}
