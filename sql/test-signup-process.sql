-- Test script to simulate signup process and debug profile creation

-- 1. Create a test user
DO $$
DECLARE
    test_user_id UUID;
    test_email TEXT := 'test@example.com';
    test_password TEXT := 'testpassword123';
    auth_result RECORD;
BEGIN
    RAISE NOTICE 'Step 1: Creating test user...';
    
    -- Create user in auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        test_email,
        crypt(test_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{}',
        '{"first_name": "Test", "last_name": "User", "age": 25, "gender": "Other"}',
        false,
        '',
        '',
        '',
        ''
    ) RETURNING id INTO test_user_id;
    
    RAISE NOTICE 'Test user created with ID: %', test_user_id;
    
    -- 2. Test Method 1: force_create_profile function
    RAISE NOTICE 'Step 2: Testing force_create_profile function...';
    
    BEGIN
        PERFORM force_create_profile(
            test_user_id,
            'Test',
            'User',
            25,
            'Other'
        );
        RAISE NOTICE 'Method 1 SUCCESS: Profile created with force function';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Method 1 FAILED: %', SQLERRM;
    END;
    
    -- 3. Check if profile was created
    RAISE NOTICE 'Step 3: Checking if profile exists...';
    
    IF EXISTS (SELECT 1 FROM profiles WHERE user_id = test_user_id) THEN
        RAISE NOTICE 'Profile EXISTS after Method 1';
    ELSE
        RAISE NOTICE 'Profile DOES NOT EXIST after Method 1';
        
        -- 4. Test Method 2: Direct insert
        RAISE NOTICE 'Step 4: Testing direct insert...';
        
        BEGIN
            INSERT INTO profiles (
                user_id,
                first_name,
                last_name,
                age,
                gender,
                bio,
                location,
                photos,
                interests,
                looking_for,
                max_distance,
                min_age,
                max_age,
                is_online
            ) VALUES (
                test_user_id,
                'Test',
                'User',
                25,
                'Other',
                '',
                '',
                '{}',
                '{}',
                '{}',
                50,
                18,
                100,
                true
            );
            RAISE NOTICE 'Method 2 SUCCESS: Profile created with direct insert';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Method 2 FAILED: %', SQLERRM;
        END;
        
        -- 5. Check again
        IF EXISTS (SELECT 1 FROM profiles WHERE user_id = test_user_id) THEN
            RAISE NOTICE 'Profile EXISTS after Method 2';
        ELSE
            RAISE NOTICE 'Profile DOES NOT EXIST after Method 2';
            
            -- 6. Test Method 3: Check trigger
            RAISE NOTICE 'Step 5: Checking if trigger created profile...';
            
            IF EXISTS (SELECT 1 FROM profiles WHERE user_id = test_user_id) THEN
                RAISE NOTICE 'Method 3 SUCCESS: Profile found from trigger';
            ELSE
                RAISE NOTICE 'Method 3 FAILED: No profile from trigger';
                
                -- 7. Test Method 4: Sync function
                RAISE NOTICE 'Step 6: Testing sync_missing_profiles function...';
                
                BEGIN
                    PERFORM sync_missing_profiles();
                    RAISE NOTICE 'Method 4 SUCCESS: Sync function executed';
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Method 4 FAILED: %', SQLERRM;
                END;
                
                -- Final check
                IF EXISTS (SELECT 1 FROM profiles WHERE user_id = test_user_id) THEN
                    RAISE NOTICE 'Profile EXISTS after Method 4';
                ELSE
                    RAISE NOTICE 'Profile DOES NOT EXIST after all methods';
                END IF;
            END IF;
        END IF;
    END IF;
    
    -- Clean up
    DELETE FROM profiles WHERE user_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RAISE NOTICE 'Test completed and cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test failed with error: %', SQLERRM;
END $$; 