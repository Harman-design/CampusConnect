import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Static host lookup helper. Adapts for Android emulator loopback.
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    // Standard emulator loopback IP for native Android
    return 'http://10.0.2.2:5000/api';
  }

  static Future<Map<String, String>> _headers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token') ?? '';
    return {
      'Content-Type': 'application/json',
      if (token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  static Future<http.Response> get(String path) async {
    final url = Uri.parse('$baseUrl$path');
    final headers = await _headers();
    return http.get(url, headers: headers);
  }

  static Future<http.Response> post(String path, Map<String, dynamic> body) async {
    final url = Uri.parse('$baseUrl$path');
    final headers = await _headers();
    return http.post(url, headers: headers, body: jsonEncode(body));
  }

  static Future<http.Response> put(String path, Map<String, dynamic> body) async {
    final url = Uri.parse('$baseUrl$path');
    final headers = await _headers();
    return http.put(url, headers: headers, body: jsonEncode(body));
  }

  static Future<http.Response> delete(String path) async {
    final url = Uri.parse('$baseUrl$path');
    final headers = await _headers();
    return http.delete(url, headers: headers);
  }
}
