import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  Map<String, dynamic>? _user;
  String? _token;
  bool _isLoading = true;

  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;

  AuthProvider() {
    restoreSession();
  }

  Future<void> restoreSession() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final userStr = prefs.getString('user');

      if (token != null && userStr != null) {
        _token = token;
        _user = jsonDecode(userStr);
        _isAuthenticated = true;
      }
    } catch (_) {}

    _isLoading = false;
    notifyListeners();
  }

  Future<String?> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiService.post('/auth/login', {
        'email': email.trim(),
        'password': password,
      });

      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        _token = data['token'];
        _user = data['user'];
        _isAuthenticated = true;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('user', jsonEncode(_user));

        _isLoading = false;
        notifyListeners();
        return null;
      } else {
        _isLoading = false;
        notifyListeners();
        return data['message'] ?? 'Login failed';
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return 'Server connection failed';
    }
  }

  Future<String?> register({
    required String name,
    required String email,
    required String password,
    required String role,
    String? department,
    int? semester,
    String? registerNumber,
  }) async {
    // Validate email domain case-insensitively
    if (!email.toLowerCase().endsWith('@srmist.edu.in')) {
      return 'Only official SRM email addresses (@srmist.edu.in) are allowed.';
    }

    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiService.post('/auth/register', {
        'name': name,
        'email': email.trim(),
        'password': password,
        'role': role,
        'department': department,
        'semester': semester,
        'registerNumber': registerNumber,
      });

      final data = jsonDecode(res.body);
      _isLoading = false;
      notifyListeners();

      if (res.statusCode == 201 && data['success'] == true) {
        return null;
      } else {
        return data['message'] ?? 'Registration failed';
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return 'Server connection failed';
    }
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    _isAuthenticated = false;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');

    notifyListeners();
  }
}
