import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _deptController = TextEditingController();
  final _registerNumController = TextEditingController();

  String _role = 'student';
  int _semester = 1;
  bool _obscurePassword = true;
  String? _errorMessage;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _deptController.dispose();
    _registerNumController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final error = await auth.register(
      name: _nameController.text,
      email: _emailController.text,
      password: _passwordController.text,
      role: _role,
      department: _role == 'student' ? _deptController.text : null,
      semester: _role == 'student' ? _semester : null,
      registerNumber: _role == 'student' ? _registerNumController.text : null,
    );

    if (mounted) {
      if (error != null) {
        setState(() {
          _errorMessage = error;
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Account created! Please sign in.')),
        );
        Navigator.of(context).pushReplacementNamed('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Container(
            maxWidth: 450,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF1F2937)),
            ),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        height: 36,
                        width: 36,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF4F8CFF), Color(0xFF7C3AED)],
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Center(
                          child: Text(
                            'CC',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'CampusConnect',
                        style: GoogleFonts.outfit(
                          fontSize: 20,
                          fontWeight: FontWeight.w955,
                          color: Colors.white,
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Create Account',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.withOpacity(0.2)),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                          color: Colors.red,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  // Name
                  TextFormField(
                    controller: _nameController,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: InputDecoration(
                      labelText: 'Full Name',
                      labelStyle: const TextStyle(color: Colors.grey, fontSize: 11),
                      prefixIcon: const Icon(Icons.person_outline, color: Colors.grey),
                      filled: true,
                      fillColor: const Color(0xFF0B1220),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF1F2937)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF4F8CFF)),
                      ),
                    ),
                    validator: (val) => val == null || val.isEmpty ? 'Name is required' : null,
                  ),
                  const SizedBox(height: 16),
                  // Email
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: InputDecoration(
                      labelText: 'Official Email (@srmist.edu.in)',
                      labelStyle: const TextStyle(color: Colors.grey, fontSize: 11),
                      prefixIcon: const Icon(Icons.email_outlined, color: Colors.grey),
                      filled: true,
                      fillColor: const Color(0xFF0B1220),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF1F2937)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF4F8CFF)),
                      ),
                    ),
                    validator: (val) {
                      if (val == null || val.isEmpty) return 'Email is required';
                      if (!val.toLowerCase().endsWith('@srmist.edu.in')) {
                        return 'Only official @srmist.edu.in addresses allowed';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  // Password
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: InputDecoration(
                      labelText: 'Password',
                      labelStyle: const TextStyle(color: Colors.grey, fontSize: 11),
                      prefixIcon: const Icon(Icons.lock_outline, color: Colors.grey),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: Colors.grey,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      filled: true,
                      fillColor: const Color(0xFF0B1220),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF1F2937)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF4F8CFF)),
                      ),
                    ),
                    validator: (val) {
                      if (val == null || val.isEmpty) return 'Password is required';
                      if (val.length < 8) return 'Password must be at least 8 chars';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  // Role Selector
                  DropdownButtonFormField<String>(
                    value: _role,
                    dropdownColor: const Color(0xFF111827),
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: InputDecoration(
                      labelText: 'Role',
                      labelStyle: const TextStyle(color: Colors.grey, fontSize: 11),
                      prefixIcon: const Icon(Icons.school_outlined, color: Colors.grey),
                      filled: true,
                      fillColor: const Color(0xFF0B1220),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF1F2937)),
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'student', child: Text('Student')),
                      DropdownMenuItem(value: 'faculty', child: Text('Faculty')),
                    ],
                    onChanged: (val) {
                      setState(() {
                        _role = val ?? 'student';
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  if (_role == 'student') ...[
                    // Department
                    TextFormField(
                      controller: _deptController,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      decoration: InputDecoration(
                        labelText: 'Department (e.g. CSE)',
                        labelStyle: const TextStyle(color: Colors.grey, fontSize: 11),
                        prefixIcon: const Icon(Icons.domain, color: Colors.grey),
                        filled: true,
                        fillColor: const Color(0xFF0B1220),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF1F2937)),
                        ),
                      ),
                      validator: (val) => _role == 'student' && (val == null || val.isEmpty) ? 'Department is required' : null,
                    ),
                    const SizedBox(height: 16),
                    // Semester
                    DropdownButtonFormField<int>(
                      value: _semester,
                      dropdownColor: const Color(0xFF111827),
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      decoration: InputDecoration(
                        labelText: 'Semester',
                        labelStyle: const TextStyle(color: Colors.grey, fontSize: 11),
                        prefixIcon: const Icon(Icons.calendar_today_outlined, color: Colors.grey),
                        filled: true,
                        fillColor: const Color(0xFF0B1220),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF1F2937)),
                        ),
                      ),
                      items: List.generate(8, (i) => i + 1).map((sem) => DropdownMenuItem(value: sem, child: Text('Semester $sem'))).toList(),
                      onChanged: (val) {
                        setState(() {
                          _semester = val ?? 1;
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    // Register Number
                    TextFormField(
                      controller: _registerNumController,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      decoration: InputDecoration(
                        labelText: 'Register Number',
                        labelStyle: const TextStyle(color: Colors.grey, fontSize: 11),
                        prefixIcon: const Icon(Icons.badge_outlined, color: Colors.grey),
                        filled: true,
                        fillColor: const Color(0xFF0B1220),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF1F2937)),
                        ),
                      ),
                      validator: (val) => _role == 'student' && (val == null || val.isEmpty) ? 'Register number required' : null,
                    ),
                    const SizedBox(height: 24),
                  ],
                  // Submit
                  ElevatedButton(
                    onPressed: auth.isLoading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F8CFF),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: auth.isLoading
                        ? const SizedBox(
                            height: 16,
                            width: 16,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            'Create Account',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => Navigator.of(context).pushReplacementNamed('/login'),
                    child: const Text(
                      'Already have an account? Sign In',
                      style: TextStyle(color: Color(0xFF4F8CFF), fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
