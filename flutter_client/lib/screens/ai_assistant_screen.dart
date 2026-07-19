import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final _inputController = TextEditingController();
  final List<Map<String, String>> _messages = [];
  bool _isLoading = false;
  String _activeTab = 'chat'; // chat, summarize, quiz, viva

  // Quiz state
  String _quizTopic = '';
  List<dynamic> _quizQuestions = [];

  // Summary state
  final _summarizeController = TextEditingController();
  String _summaryResult = '';

  @override
  void dispose() {
    _inputController.dispose();
    _summarizeController.dispose();
    super.dispose();
  }

  void _sendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _isLoading = true;
    });
    _inputController.clear();

    try {
      final res = await ApiService.post('/ai/chat', {
        'message': text,
        'history': _messages.sublist(0, _messages.length - 1).map((m) => {
          'role': m['role'],
          'parts': m['content']
        }).toList()
      });

      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _messages.add({'role': 'model', 'content': data['data']['reply']});
        });
      } else {
        setState(() {
          _messages.add({'role': 'model', 'content': data['message'] ?? 'Error fetching AI answer.'});
        });
      }
    } catch (_) {
      setState(() {
        _messages.add({'role': 'model', 'content': 'Server connection failed.'});
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _generateSummary() async {
    final text = _summarizeController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _isLoading = true;
      _summaryResult = '';
    });

    try {
      final res = await ApiService.post('/ai/summarize', {'text': text, 'length': 'medium'});
      final data = jsonDecode(res.body);

      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _summaryResult = data['data']['summary'] ?? '';
        });
      } else {
        setState(() {
          _summaryResult = data['message'] ?? 'Failed to summarize';
        });
      }
    } catch (_) {
      setState(() {
        _summaryResult = 'Server connection failed';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('AI Study Assistant', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // Tab bar selection
          Container(
            color: const Color(0xFF111827),
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildTabButton('chat', 'AI Chat'),
                _buildTabButton('summarize', 'Summarizer'),
                _buildTabButton('quiz', 'Quiz Practice'),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: _buildTabContent(),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildTabButton(String key, String label) {
    final isActive = _activeTab == key;
    return TextButton(
      onPressed: () => setState(() => _activeTab = key),
      child: Text(
        label,
        style: TextStyle(
          color: isActive ? const Color(0xFF4F8CFF) : Colors.grey,
          fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_activeTab) {
      case 'chat':
        return Column(
          children: [
            Expanded(
              child: _messages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.auto_awesome, size: 40, color: Colors.grey),
                          SizedBox(height: 16),
                          Text('Ask anything related to your syllabus resources', style: TextStyle(color: Colors.grey, fontSize: 11)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: _messages.length,
                      itemBuilder: (context, index) {
                        final msg = _messages[index];
                        final isUser = msg['role'] == 'user';
                        return Align(
                          alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.symmetric(horizontal: 16, py: 10),
                            decoration: BoxDecoration(
                              color: isUser ? const Color(0xFF4F8CFF).withOpacity(0.15) : const Color(0xFF111827),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: isUser ? const Color(0xFF4F8CFF).withOpacity(0.2) : const Color(0xFF1F2937)),
                            ),
                            child: MarkdownBody(
                              data: msg['content'] ?? '',
                              styleSheet: MarkdownStyleSheet(
                                p: const TextStyle(color: Colors.white, fontSize: 12, height: 1.5),
                                code: const TextStyle(backgroundColor: Color(0xFF0B1220), color: Color(0xFF4F8CFF), fontSize: 11),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
            if (_isLoading) const Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator()),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: InputDecoration(
                      hintText: 'Ask a learning question...',
                      hintStyle: const TextStyle(color: Colors.grey, fontSize: 11),
                      filled: true,
                      fillColor: const Color(0xFF111827),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF1F2937)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF4F8CFF)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                IconButton(
                  icon: const Icon(Icons.send, color: Color(0xFF4F8CFF)),
                  onPressed: _sendMessage,
                )
              ],
            )
          ],
        );

      case 'summarize':
        return ListView(
          children: [
            TextField(
              controller: _summarizeController,
              maxLines: 6,
              style: const TextStyle(color: Colors.white, fontSize: 12),
              decoration: InputDecoration(
                hintText: 'Paste study notes context here to summarize...',
                hintStyle: const TextStyle(color: Colors.grey, fontSize: 11),
                filled: true,
                fillColor: const Color(0xFF111827),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF1F2937)),
                ),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isLoading ? null : _generateSummary,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F8CFF)),
              child: const Text('Summarize Context'),
            ),
            const SizedBox(height: 24),
            if (_summaryResult.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF111827),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF1F2937)),
                ),
                child: MarkdownBody(
                  data: _summaryResult,
                  styleSheet: MarkdownStyleSheet(
                    p: const TextStyle(color: Colors.white, fontSize: 12, height: 1.5),
                  ),
                ),
              ),
          ],
        );

      default:
        return const Center(child: Text('Coming soon on Mobile device packages', style: TextStyle(color: Colors.grey)));
    }
  }
}
